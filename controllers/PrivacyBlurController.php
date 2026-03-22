<?php

namespace Pterodactyl\BlueprintFramework\Extensions\privacyblur;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pterodactyl\Http\Controllers\Controller;

class PrivacyBlurController extends Controller
{
    private const SETTINGS_FILE = __DIR__ . '/../data/settings.php';

    private const DEFAULTS = [
        'blur_emails' => true,
        'blur_ipv4' => true,
        'blur_ipv6' => false,
        'blur_uuid' => true,
        'blur_console' => true,
    ];

    public function settings(): JsonResponse
    {
        return response()->json(['data' => $this->loadSettings()]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'blur_emails' => 'boolean',
            'blur_ipv4' => 'boolean',
            'blur_ipv6' => 'boolean',
            'blur_uuid' => 'boolean',
            'blur_console' => 'boolean',
        ]);

        $this->saveSettings($validated);

        return response()->json(['data' => $this->loadSettings()]);
    }

    private function loadSettings(): array
    {
        if (!file_exists(self::SETTINGS_FILE)) {
            return self::DEFAULTS;
        }

        $data = @include self::SETTINGS_FILE;
        if (!is_array($data)) {
            return self::DEFAULTS;
        }

        return array_merge(self::DEFAULTS, $data);
    }

    private function saveSettings(array $settings): void
    {
        $merged = array_merge(self::DEFAULTS, $settings);
        $dir = dirname(self::SETTINGS_FILE);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents(self::SETTINGS_FILE, '<?php' . PHP_EOL . PHP_EOL . 'return ' . var_export($merged, true) . ';' . PHP_EOL);
    }
}
