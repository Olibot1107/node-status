<?php

namespace Pterodactyl\BlueprintFramework\Extensions\nodestatus;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;

class PhpMyAdminController extends Controller
{
    public function config(): JsonResponse
    {
        return response()->json($this->loadConfig());
    }

    /**
     * @return array<string, string>
     */
    private function loadConfig(): array
    {
        $config = $this->getDefaults();
        $path = $this->getConfigPath();

        if (!file_exists($path)) {
            return $config;
        }

        $data = @include $path;
        if (!is_array($data)) {
            return $config;
        }

        $config['phpmyadmin_url'] = trim((string) ($data['phpmyadmin_url'] ?? ''));

        return $config;
    }

    /**
     * @return string[]
     */
    private function getDefaults(): array
    {
        return [
            'phpmyadmin_url' => '',
        ];
    }

    private function getConfigPath(): string
    {
        return __DIR__ . '/../data/config.php';
    }
}
