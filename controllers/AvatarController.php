<?php

namespace Pterodactyl\BlueprintFramework\Extensions\customavatars;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Http\Controllers\Controller;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class AvatarController extends Controller
{
    private const MAX_UPLOAD_SIZE = 5120; // kilobytes
    private const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    private const DEFAULT_MIME = 'image/png';
    private const ALLOWED_MIME_TYPES = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
    ];
    private const API_HEADER = 'authorization';
    private const API_TOKEN_PREFIX = 'Bearer ';
    private const API_CONFIG = __DIR__ . '/../data/api.php';

    public function current(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $meta = $this->readMetadata($userId);

        return response()->json([
            'data' => [
                'has_avatar' => $meta !== null,
                'avatar_url' => $meta ? $this->buildAvatarUrl($userId) : null,
            ],
        ]);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => sprintf('required|image|mimes:%s|max:%d', implode(',', self::ALLOWED_EXTENSIONS), self::MAX_UPLOAD_SIZE),
        ]);

        /** @var UploadedFile $file */
        $file = $request->file('avatar');
        $this->storeUploadedFile($request->user()->id, $file);

        return response()->json([
            'data' => [
                'avatar_url' => $this->buildAvatarUrl($request->user()->id),
            ],
        ]);
    }

    public function remove(Request $request): JsonResponse
    {
        $this->deleteAvatar($request->user()->id);

        return response()->json(['data' => ['avatar_url' => null]]);
    }

    public function serve(Request $request, ?int $userId = null): Response
    {
        $userId ??= $request->user()->id;
        $meta = $this->readMetadata($userId);

        if (!$meta) {
            abort(404);
        }

        return response(base64_decode($meta['content']), 200, [
            'Content-Type' => $meta['mime'],
            'Cache-Control' => 'public, max-age=86400, immutable',
        ]);
    }

    public function apiUpload(Request $request, int $userId): JsonResponse
    {
        $this->ensureAuthorized($request);

        if ($request->hasFile('avatar')) {
            /** @var UploadedFile $file */
            $file = $request->file('avatar');
            $this->storeUploadedFile($userId, $file);
        } elseif ($payload = $request->input('base64')) {
            $this->storeBase64Payload($userId, $payload);
        } else {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'No avatar payload provided.');
        }

        return response()->json([
            'data' => [
                'avatar_url' => $this->buildAvatarUrl($userId),
            ],
        ]);
    }

    public function apiRemove(Request $request, int $userId): JsonResponse
    {
        $this->ensureAuthorized($request);
        $this->deleteAvatar($userId);

        return response()->json(['data' => ['avatar_url' => null]]);
    }

    private function deleteAvatar(int $userId): bool
    {
        return (bool) DB::table('custom_avatars')->where('user_id', $userId)->delete();
    }

    private function readMetadata(int $userId): ?array
    {
        $record = DB::table('custom_avatars')->where('user_id', $userId)->first();
        if (!$record) {
            return null;
        }

        return [
            'content' => $record->content,
            'mime' => $record->mime ?? self::DEFAULT_MIME,
        ];
    }

    private function storeUploadedFile(int $userId, UploadedFile $file): void
    {
        $mime = $file->getMimeType() ?? self::DEFAULT_MIME;
        $contents = $this->loadFileContents($file->path());

        $this->storeContents($userId, $contents, $mime);
    }

    private function storeBase64Payload(int $userId, string $payload): void
    {
        $mime = self::DEFAULT_MIME;
        if (preg_match('#^data:(.+?);base64,#', $payload, $matches)) {
            $mime = $matches[1];
            $payload = substr($payload, strpos($payload, 'base64,') + 7);
        }

        $payload = trim($payload);
        $contents = base64_decode($payload, true);
        if ($contents === false) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Invalid base64 payload.');
        }

        $this->storeContents($userId, $contents, $mime);
    }

    private function storeContents(int $userId, string $contents, string $mime): void
    {
        $this->ensureMimeAllowed($mime);
        if (strlen($contents) > self::MAX_UPLOAD_SIZE * 1024) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Avatar exceeds size limit.');
        }
        $this->writeMetadata($userId, base64_encode($contents), $mime);
    }

    private function ensureMimeAllowed(string $mime): void
    {
        if (!in_array($mime, self::ALLOWED_MIME_TYPES, true)) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Unsupported image type.');
        }
    }

    private function loadFileContents(string $path): string
    {
        $contents = file_get_contents($path);
        if ($contents === false) {
            abort(Response::HTTP_INTERNAL_SERVER_ERROR, 'Unable to read uploaded file.');
        }

        if (strlen($contents) > self::MAX_UPLOAD_SIZE * 1024) {
            abort(Response::HTTP_UNPROCESSABLE_ENTITY, 'Avatar exceeds size limit.');
        }

        return $contents;
    }

    private function writeMetadata(int $userId, string $content, string $mime): void
    {
        DB::table('custom_avatars')->updateOrInsert(
            ['user_id' => $userId],
            [
                'user_id' => $userId,
                'content' => $content,
                'mime' => $mime,
                'updated_at' => Carbon::now(),
                'created_at' => Carbon::now(),
            ]
        );
    }

    private function buildAvatarUrl(int $userId): string
    {
        return route('extensions.customavatars.avatar.file', ['userId' => $userId]);
    }

    private function ensureAuthorized(Request $request): void
    {
        $header = $request->header(self::API_HEADER);
        if (!$header || !str_starts_with($header, self::API_TOKEN_PREFIX)) {
            abort(Response::HTTP_UNAUTHORIZED);
        }

        $token = substr($header, strlen(self::API_TOKEN_PREFIX));
        if (!$token || !in_array($token, $this->loadApiKeys(), true)) {
            abort(Response::HTTP_FORBIDDEN);
        }
    }

    private function loadApiKeys(): array
    {
        if (!file_exists(self::API_CONFIG)) {
            return [];
        }

        $data = @include self::API_CONFIG;
        if (!is_array($data)) {
            return [];
        }

        return array_values($data['keys'] ?? []);
    }
}
