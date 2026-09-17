<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Services\ApplicationNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewerApplicationController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Application::query()
                ->where('status', '!=', ApplicationStatus::Draft->value)
                ->with('applicant:id,name,email')
                ->latest('submitted_at')
                ->get()
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $application = DB::transaction(function () use ($request, $id) {
            $application = Application::query()
                ->where('status', '!=', ApplicationStatus::Draft->value)
                ->lockForUpdate()
                ->findOrFail($id);

            if ($application->status === ApplicationStatus::Submitted) {
                $application->transitionTo(ApplicationStatus::UnderReview);
                $application->reviewer_id = $request->user()->id;
                $application->save();
            }

            return $application;
        });

        return response()->json($application->load(['applicant:id,name,email', 'reviewer:id,name,email', 'documents']));
    }

    public function approve(Request $request, int $id, ApplicationNotificationService $notifications): JsonResponse
    {
        $application = $this->review($request, $id, ApplicationStatus::Approved, null);
        $notifications->approved($application);

        return response()->json($application->fresh()->load('documents'));
    }

    public function returnApplication(Request $request, int $id, ApplicationNotificationService $notifications): JsonResponse
    {
        $data = $request->validate(['comment' => ['required', 'string', 'max:2000']]);
        $application = $this->review($request, $id, ApplicationStatus::Returned, $data['comment']);
        $notifications->returned($application);

        return response()->json($application->fresh()->load('documents'));
    }

    private function review(Request $request, int $id, ApplicationStatus $result, ?string $comment): Application
    {
        return DB::transaction(function () use ($request, $id, $result, $comment) {
            $application = Application::query()->lockForUpdate()->findOrFail($id);

            if ($application->status === ApplicationStatus::Submitted) {
                $application->transitionTo(ApplicationStatus::UnderReview);
            }

            $application->transitionTo($result);
            $application->forceFill([
                'reviewer_id' => $request->user()->id,
                'review_comment' => $comment,
                'reviewed_at' => now(),
            ])->save();

            return $application;
        });
    }
}
