<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApplicationDocumentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ReviewerApplicationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'status' => 'ok',
    'environment' => app()->environment(),
    'timestamp' => now()->toIso8601String(),
]));

Route::post('/login', [AuthController::class, 'applicantLogin']);
Route::post('/reviewer/login', [AuthController::class, 'reviewerLogin']);

Route::middleware(['auth:sanctum', 'role:applicant'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{id}', [ApplicationController::class, 'show']);
    Route::put('/applications/{id}', [ApplicationController::class, 'update']);
    Route::delete('/applications/{id}', [ApplicationController::class, 'destroy']);
    Route::post('/applications/{id}/submit', [ApplicationController::class, 'submit']);
    Route::post('/applications/{id}/documents', [ApplicationDocumentController::class, 'store']);
    Route::get('/applications/{id}/documents/{documentId}', [ApplicationDocumentController::class, 'download']);
    Route::delete('/applications/{id}/documents/{documentId}', [ApplicationDocumentController::class, 'destroy']);
});

Route::prefix('reviewer')->middleware(['auth:sanctum', 'role:reviewer'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/applications', [ReviewerApplicationController::class, 'index']);
    Route::get('/applications/{id}', [ReviewerApplicationController::class, 'show']);
    Route::post('/applications/{id}/approve', [ReviewerApplicationController::class, 'approve']);
    Route::post('/applications/{id}/return', [ReviewerApplicationController::class, 'returnApplication']);
    Route::get('/applications/{id}/documents/{documentId}', [ApplicationDocumentController::class, 'reviewerDownload']);
});
