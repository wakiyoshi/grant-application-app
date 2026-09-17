<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'applicant_id', 'corporation_name', 'corporation_number',
    'medical_institution_name', 'contact_name', 'email', 'amount',
    'description', 'status', 'reviewer_id', 'review_comment',
    'submitted_at', 'reviewed_at',
])]
class Application extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'amount' => 'integer',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function applicant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function transitionTo(ApplicationStatus $next): void
    {
        if (! $this->status->canTransitionTo($next)) {
            abort(409, "{$this->status->value} から {$next->value} へは変更できません。");
        }

        $this->status = $next;
    }
}
