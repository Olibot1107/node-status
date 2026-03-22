<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\privacyblur\PrivacyBlurController;

Route::get('/settings', [PrivacyBlurController::class, 'settings']);
Route::post('/settings', [PrivacyBlurController::class, 'update']);
