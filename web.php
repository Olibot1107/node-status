<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\nodestatus\NodeStatusController;

Route::get('/status', [NodeStatusController::class, 'status']);
