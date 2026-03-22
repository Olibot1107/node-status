<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\nodestatus\PhpMyAdminController;

Route::get('/config', [PhpMyAdminController::class, 'config']);
