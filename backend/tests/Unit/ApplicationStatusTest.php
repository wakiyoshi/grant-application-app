<?php

namespace Tests\Unit;

use App\Enums\ApplicationStatus;
use PHPUnit\Framework\TestCase;

class ApplicationStatusTest extends TestCase
{
    public function test_draft_can_be_submitted_but_cannot_be_approved_directly(): void
    {
        $this->assertTrue(ApplicationStatus::Draft->canTransitionTo(ApplicationStatus::Submitted));
        $this->assertFalse(ApplicationStatus::Draft->canTransitionTo(ApplicationStatus::Approved));
    }

    public function test_submitted_application_can_enter_review(): void
    {
        $this->assertTrue(ApplicationStatus::Submitted->canTransitionTo(ApplicationStatus::UnderReview));
    }

    public function test_application_under_review_can_be_approved_or_returned(): void
    {
        $this->assertTrue(ApplicationStatus::UnderReview->canTransitionTo(ApplicationStatus::Approved));
        $this->assertTrue(ApplicationStatus::UnderReview->canTransitionTo(ApplicationStatus::Returned));
    }

    public function test_returned_application_can_be_resubmitted(): void
    {
        $this->assertTrue(ApplicationStatus::Returned->canTransitionTo(ApplicationStatus::Submitted));
    }

    public function test_approved_application_cannot_change_status(): void
    {
        foreach (ApplicationStatus::cases() as $next) {
            $this->assertFalse(
                ApplicationStatus::Approved->canTransitionTo($next),
                "An approved application must not transition to {$next->value}.",
            );
        }
    }
}
