<?php

use App\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;
use Pterodactyl\BlueprintFramework\Extensions\customavatars\AvatarController;

Route::get('/avatar', [AvatarController::class, 'current']);
Route::post('/avatar', [AvatarController::class, 'upload']);
Route::delete('/avatar', [AvatarController::class, 'remove']);
Route::get('/avatar/file/{userId?}', [AvatarController::class, 'serve'])->name('extensions.customavatars.avatar.file');
Route::post('/api/avatar/{userId}', [AvatarController::class, 'apiUpload'])
    ->withoutMiddleware([VerifyCsrfToken::class]);
Route::delete('/api/avatar/{userId}', [AvatarController::class, 'apiRemove'])
    ->withoutMiddleware([VerifyCsrfToken::class]);
