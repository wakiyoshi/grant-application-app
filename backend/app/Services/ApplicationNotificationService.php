<?php

namespace App\Services;

use App\Mail\ApplicationStatusMail;
use App\Models\Application;
use Illuminate\Support\Facades\Mail;

class ApplicationNotificationService
{
    public function submitted(Application $application): void
    {
        $this->send($application, '補助金申請を受け付けました', '申請を受け付けました。審査完了までお待ちください。');
    }

    public function approved(Application $application): void
    {
        $this->send($application, '補助金申請が承認されました', '申請が承認されました。');
    }

    public function returned(Application $application): void
    {
        $comment = $application->review_comment ?: '内容をご確認のうえ、修正して再提出してください。';
        $this->send($application, '補助金申請が差し戻されました', "申請が差し戻されました。\n\nコメント: {$comment}");
    }

    private function send(Application $application, string $subject, string $body): void
    {
        Mail::to($application->email)->send(
            new ApplicationStatusMail($application, $subject, $body),
        );
    }
}
