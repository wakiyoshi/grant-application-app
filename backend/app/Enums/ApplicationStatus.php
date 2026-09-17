<?php

namespace App\Enums;

enum ApplicationStatus: string
{
    case Draft = 'DRAFT';
    case Submitted = 'SUBMITTED';
    case UnderReview = 'UNDER_REVIEW';
    case Approved = 'APPROVED';
    case Returned = 'RETURNED';

    public function canTransitionTo(self $next): bool
    {
        return match ($this) {
            self::Draft => $next === self::Submitted,
            self::Returned => $next === self::Submitted,
            self::Submitted => $next === self::UnderReview,
            self::UnderReview => in_array($next, [self::Approved, self::Returned], true),
            self::Approved => false,
        };
    }
}
