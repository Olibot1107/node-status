<?php

namespace Pterodactyl\BlueprintFramework\Extensions\nodestatus;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Node;
use Throwable;

class NodeStatusController extends Controller
{
    public function status(): JsonResponse
    {
        $nodes = Node::with('location:id,short,long')->orderBy('name')->get();

        $payload = $nodes->map(function (Node $node) {
            $probe = $this->probeNode($node);

            return [
                'id' => $node->id,
                'uuid' => $node->uuid,
                'name' => $node->name,
                'fqdn' => $node->fqdn,
                'scheme' => $node->scheme,
                'daemon_port' => $node->daemonListen,
                'location_short' => $node->location?->short,
                'location_long' => $node->location?->long,
                'maintenance_mode' => $node->maintenance_mode,
                'status' => $probe['status'],
                'checked_at' => $probe['checked_at'],
                'error' => $probe['error'],
            ];
        });

        return response()->json($payload);
    }

    private function probeNode(Node $node): array
    {
        $key = sprintf('nodestatus:node:%s', $node->id);

        return Cache::remember($key, 30, function () use ($node) {
            $checkedAt = now()->toIso8601String();
            $payload = [
                'status' => 'offline',
                'checked_at' => $checkedAt,
                'error' => null,
            ];

            try {
                $response = Http::timeout(2)
                    ->withoutVerifying()
                    ->get(rtrim($node->getConnectionAddress(), '/') . '/v1/ping');

                if ($response->successful()) {
                    $payload['status'] = 'online';
                } else {
                    $payload['error'] = sprintf('unexpected response (%s)', $response->status());
                }
            } catch (Throwable $exception) {
                $payload['error'] = $exception->getMessage();
            }

            return $payload;
        });
    }
}
