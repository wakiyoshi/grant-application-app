<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Services\ApplicationNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $applications = Application::query()
            ->whereBelongsTo($request->user(), 'applicant')
            ->latest()
            ->get();

        return response()->json($applications);
    }

    public function store(Request $request): JsonResponse
    {
        $application = $request->user()->applications()->create(
            $this->validatedApplication($request) + ['status' => ApplicationStatus::Draft]
        );

        return response()->json($application, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json($this->ownedApplication($request, $id)->load('documents'));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $application = $this->ownedApplication($request, $id);
        abort_unless(in_array($application->status, [ApplicationStatus::Draft, ApplicationStatus::Returned], true), 409, '下書きまたは差戻し状態のみ編集できます。');

        $application->update($this->validatedApplication($request));

        return response()->json($application->fresh());
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $application = $this->ownedApplication($request, $id);
        abort_unless(in_array($application->status, [ApplicationStatus::Draft, ApplicationStatus::Returned], true), 409, '下書きまたは差戻し状態のみ削除できます。');
        foreach ($application->documents as $document) {
            Storage::disk($document->disk)->delete($document->path);
        }
        $application->delete();

        return response()->json(null, 204);
    }

    public function submit(Request $request, int $id, ApplicationNotificationService $notifications): JsonResponse
    {
        $application = DB::transaction(function () use ($request, $id) {
            $application = Application::query()
                ->whereBelongsTo($request->user(), 'applicant')
                ->lockForUpdate()
                ->findOrFail($id);
            $application->transitionTo(ApplicationStatus::Submitted);
            $application->forceFill([
                'submitted_at' => now(),
                'reviewer_id' => null,
                'review_comment' => null,
                'reviewed_at' => null,
            ])->save();

            return $application;
        });

        $notifications->submitted($application);

        return response()->json($application->fresh()->load('documents'));
    }

    private function ownedApplication(Request $request, int $id): Application
    {
        return Application::query()
            ->whereBelongsTo($request->user(), 'applicant')
            ->findOrFail($id);
    }

    /** @return array<string, mixed> */
    private function validatedApplication(Request $request): array
    {
        return $request->validate([
            'corporation_name' => ['required', 'string', 'max:255'],
            'corporation_number' => ['required', 'regex:/^\\d{13}$/'],
            'medical_institution_name' => ['required', 'string', 'max:255'],
            'contact_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'amount' => ['required', 'integer', 'min:1', 'max:999999999999'],
            'description' => ['required', 'string', 'max:10000'],
        ]);
    }
}
