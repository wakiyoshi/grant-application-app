<?php

namespace Tests\Feature;

use App\Enums\ApplicationStatus;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApplicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_applicant_can_create_submit_and_reviewer_can_approve(): void
    {
        Mail::fake();
        $applicant = User::factory()->create(['role' => 'applicant']);
        $reviewer = User::factory()->create(['role' => 'reviewer']);

        Sanctum::actingAs($applicant);
        $created = $this->postJson('/api/applications', $this->payload())
            ->assertCreated()
            ->assertJsonPath('status', 'DRAFT')
            ->json();

        Storage::fake('local');
        config(['filesystems.default' => 'local']);
        $this->post("/api/applications/{$created['id']}/documents", [
            'documents' => [UploadedFile::fake()->create('application.pdf', 100, 'application/pdf')],
        ], ['Accept' => 'application/json'])->assertCreated();
        $document = ApplicationDocument::query()->firstOrFail();
        Storage::disk('local')->assertExists($document->path);

        $this->postJson("/api/applications/{$created['id']}/submit")
            ->assertOk()
            ->assertJsonPath('status', 'SUBMITTED');
        Mail::assertSentCount(1);

        Sanctum::actingAs($reviewer);
        $this->getJson("/api/reviewer/applications/{$created['id']}")
            ->assertOk()
            ->assertJsonPath('status', 'UNDER_REVIEW')
            ->assertJsonPath('documents.0.original_name', 'application.pdf');
        $this->get("/api/reviewer/applications/{$created['id']}/documents/{$document->id}")
            ->assertOk();

        $this->postJson("/api/reviewer/applications/{$created['id']}/approve")
            ->assertOk()
            ->assertJsonPath('status', 'APPROVED');
        Mail::assertSentCount(2);

        $this->assertDatabaseHas('applications', [
            'id' => $created['id'],
            'status' => ApplicationStatus::Approved->value,
            'reviewer_id' => $reviewer->id,
        ]);
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        Mail::fake();
        $applicant = User::factory()->create(['role' => 'applicant']);
        $application = Application::query()->create($this->payload() + [
            'applicant_id' => $applicant->id,
            'status' => ApplicationStatus::Approved,
        ]);

        Sanctum::actingAs($applicant);
        $this->postJson("/api/applications/{$application->id}/submit")->assertStatus(409);
        $this->putJson("/api/applications/{$application->id}", $this->payload())->assertStatus(409);
    }

    public function test_applicant_can_attach_an_image_when_creating_an_application(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);
        $applicant = User::factory()->create(['role' => 'applicant']);
        Sanctum::actingAs($applicant);

        $response = $this->post('/api/applications', $this->payload() + [
            'documents' => [UploadedFile::fake()->createWithContent(
                'facility.png',
                base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='),
            )],
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('documents.0.original_name', 'facility.png')
            ->assertJsonPath('documents.0.mime_type', 'image/png');

        $document = ApplicationDocument::query()->firstOrFail();
        $this->assertSame($response->json('id'), $document->application_id);
        Storage::disk('local')->assertExists($document->path);
    }

    public function test_roles_and_application_ownership_are_enforced(): void
    {
        $owner = User::factory()->create(['role' => 'applicant']);
        $other = User::factory()->create(['role' => 'applicant']);
        $application = Application::query()->create($this->payload() + [
            'applicant_id' => $owner->id,
            'status' => ApplicationStatus::Draft,
        ]);

        Sanctum::actingAs($other);
        $this->getJson("/api/applications/{$application->id}")->assertNotFound();
        $this->getJson('/api/reviewer/applications')->assertForbidden();
    }

    public function test_health_endpoint_is_public(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('status', 'ok');
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return [
            'corporation_name' => '医療法人テスト会',
            'corporation_number' => '1234567890123',
            'medical_institution_name' => 'テスト病院',
            'contact_name' => '申請 太郎',
            'email' => 'contact@example.com',
            'amount' => 1000000,
            'description' => '医療機器導入のための申請です。',
        ];
    }
}
