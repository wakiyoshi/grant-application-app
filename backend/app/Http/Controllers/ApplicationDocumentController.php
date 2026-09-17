<?php

namespace App\Http\Controllers;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApplicationDocumentController extends Controller
{
    public function store(Request $request, int $id): JsonResponse
    {
        $application = $this->ownedApplication($request, $id);
        abort_unless(in_array($application->status, [ApplicationStatus::Draft, ApplicationStatus::Returned], true), 409, '下書きまたは差戻し状態のみ書類を追加できます。');

        $data = $request->validate([
            'documents' => ['required', 'array', 'min:1', 'max:5'],
            'documents.*' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]);
        abort_if($application->documents()->count() + count($data['documents']) > 5, 422, '添付書類は合計5ファイルまでです。');

        $disk = config('filesystems.default');
        $created = [];

        foreach ($data['documents'] as $file) {
            $filename = Str::uuid().'.'.$file->extension();
            $path = Storage::disk($disk)->putFileAs("applications/{$application->id}", $file, $filename);
            abort_if($path === false, 500, '書類を保存できませんでした。');

            $created[] = $application->documents()->create([
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
                'size' => $file->getSize(),
            ]);
        }

        return response()->json($created, 201);
    }

    public function download(Request $request, int $id, int $documentId): StreamedResponse
    {
        $application = $this->ownedApplication($request, $id);

        return $this->downloadDocument($application, $documentId);
    }

    public function reviewerDownload(int $id, int $documentId): StreamedResponse
    {
        $application = Application::query()
            ->where('status', '!=', ApplicationStatus::Draft->value)
            ->findOrFail($id);

        return $this->downloadDocument($application, $documentId);
    }

    public function destroy(Request $request, int $id, int $documentId): JsonResponse
    {
        $application = $this->ownedApplication($request, $id);
        abort_unless(in_array($application->status, [ApplicationStatus::Draft, ApplicationStatus::Returned], true), 409, '下書きまたは差戻し状態のみ書類を削除できます。');
        $document = $application->documents()->findOrFail($documentId);

        Storage::disk($document->disk)->delete($document->path);
        $document->delete();

        return response()->json(null, 204);
    }

    private function ownedApplication(Request $request, int $id): Application
    {
        return Application::query()
            ->whereBelongsTo($request->user(), 'applicant')
            ->findOrFail($id);
    }

    private function downloadDocument(Application $application, int $documentId): StreamedResponse
    {
        $document = $application->documents()->findOrFail($documentId);
        abort_unless(Storage::disk($document->disk)->exists($document->path), 404, '書類が見つかりません。');

        return Storage::disk($document->disk)->download(
            $document->path,
            $document->original_name,
            ['Content-Type' => $document->mime_type],
        );
    }
}
