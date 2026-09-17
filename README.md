# 医療法人向け補助金申請・審査システム

既存AWS基盤とGitHub Actions CI/CDの疎通確認を目的にした、申請から審査・メール通知までの最小構成アプリケーションです。AWSリソースは作成しません。

## 使用技術

- Frontend: React 19、TypeScript、Vite、React Router、Axios
- Backend: Laravel 13、PHP 8.4、REST API、Laravel Sanctum
- Database: MySQL 8.4 / Aurora MySQL互換
- Mail: Laravel Mail（AWSではSES、ローカルではMailHog）
- Runtime: Apache + PHP 8.4 Docker image
- CI/CD: GitHub Actions、AWS OIDC、S3、CloudFront、ECR、ECS Fargate

## ディレクトリ構成

```text
.
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/applicant/
│   │   ├── pages/reviewer/
│   │   ├── routes/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── app/Enums/
│   ├── app/Http/Controllers/
│   ├── app/Http/Middleware/
│   ├── app/Models/
│   ├── app/Services/
│   ├── database/migrations/
│   ├── database/seeders/
│   ├── routes/api.php
│   ├── tests/
│   └── Dockerfile
├── .github/workflows/
│   ├── application.yml
│   └── promote-backend.yml
└── docker-compose.yml
```

## 画面一覧

申請者:

- `/login`: ログイン
- `/applications`: 申請一覧
- `/applications/new`: 新規申請
- `/applications/:id`: 申請詳細、書類アップロード/ダウンロード/削除、提出
- `/applications/:id/edit`: 申請編集

審査担当者:

- `/reviewer/login`: 審査担当者ログイン
- `/reviewer/applications`: 審査一覧
- `/reviewer/applications/:id`: 審査詳細、書類ダウンロード、承認、差戻し

## API一覧

| Method | Path | 認証 | 用途 |
|---|---|---|---|
| GET | `/api/health` | 不要 | ALB/ECSヘルスチェック |
| POST | `/api/login` | 不要 | 申請者ログイン |
| POST | `/api/logout` | 申請者 | 申請者ログアウト |
| GET/POST | `/api/applications` | 申請者 | 自分の申請一覧/作成 |
| GET/PUT/DELETE | `/api/applications/{id}` | 申請者 | 自分の申請詳細/編集/削除 |
| POST | `/api/applications/{id}/submit` | 申請者 | 申請提出 |
| POST | `/api/applications/{id}/documents` | 申請者 | 申請書類アップロード |
| GET/DELETE | `/api/applications/{id}/documents/{documentId}` | 申請者 | 自分の書類ダウンロード/削除 |
| POST | `/api/reviewer/login` | 不要 | 審査担当者ログイン |
| POST | `/api/reviewer/logout` | 審査担当者 | 審査担当者ログアウト |
| GET | `/api/reviewer/applications` | 審査担当者 | 審査一覧 |
| GET | `/api/reviewer/applications/{id}` | 審査担当者 | 審査詳細 |
| POST | `/api/reviewer/applications/{id}/approve` | 審査担当者 | 承認 |
| POST | `/api/reviewer/applications/{id}/return` | 審査担当者 | 差戻し（`comment`必須） |
| GET | `/api/reviewer/applications/{id}/documents/{documentId}` | 審査担当者 | 申請書類ダウンロード |

## DBテーブル

- `users`: 申請者・審査担当者。`role`は`applicant`または`reviewer`
- `applications`: 法人・医療機関・担当者・金額・内容・状態・審査情報
- `application_documents`: 添付元ファイル名、保存disk/path、MIME type、ファイルサイズ
- `personal_access_tokens`: Sanctum APIトークン
- Laravel標準の`password_reset_tokens`、`sessions`、`cache`、`jobs`関連テーブル

`applications.applicant_id`で所有者を制限し、他の申請者のデータは404にします。審査APIは`reviewer`ロールに限定します。

## 認証方式

SanctumのBearer token方式です。申請者と審査担当者はログインAPIとFrontend保存キーを分離しています。簡易疎通確認用のためFrontendはトークンを`localStorage`に保存します。本番業務利用へ拡張する場合はHttpOnly Cookie方式、MFA、監査ログ等を検討してください。

## ステータス遷移

```text
DRAFT ──提出──> SUBMITTED ──審査処理開始──> UNDER_REVIEW
  ^                                           ├──承認──> APPROVED
  |                                           └──差戻し──> RETURNED
  └────────────────修正・再提出──────────────────────┘
```

審査担当者が詳細を開くと`SUBMITTED`から`UNDER_REVIEW`へ移り、担当者を記録します。詳細を経由せず承認・差戻しAPIを呼んだ場合も、同一DBトランザクション内で`UNDER_REVIEW`を経由します。編集・削除は`DRAFT`/`RETURNED`のみです。不正遷移はHTTP 409で拒否します。

## SES送信箇所

`ApplicationNotificationService`から次のタイミングで申請先メールアドレスへ送ります。

- 申請提出完了
- 申請承認
- 申請差戻し（審査コメントを含む）

ローカルでは`MAIL_MAILER=smtp`でMailHogへ送信します。AWSでは`MAIL_MAILER=ses`とし、ECS Task RoleからSESを呼び出します。

## ローカル起動

必要なものはDockerとNode.jsです。BackendのComposer依存関係はDocker build時に自動でインストールされます。

```bash
# リポジトリ直下で実行
cp .env.example .env
docker compose up --build -d

APP_KEY="$(docker compose exec -T backend php artisan key:generate --show)"
printf 'APP_KEY=%s\n' "$APP_KEY" > .env
docker compose restart backend

docker compose exec backend php artisan migrate --seed

cd frontend
npm ci
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/api/health`
- MailHog: `http://localhost:8025`
- 申請者: `applicant@example.com` / `password`
- 審査担当者: `reviewer@example.com` / `password`

Backendのコードや`composer.lock`を変更した場合は、`docker compose up --build -d`で再buildしてください。サンプル認証情報はローカル専用です。

### ローカルメール確認

ローカルではSESへ送信せず、SMTPでMailHogへ送信します。

1. `http://localhost:8025`を開く。
2. 画面から申請提出・承認・差戻しを実行する。
3. MailHogの受信トレイで宛先、件名、本文を確認する。

メールはMailHog内で捕捉され、実際のメールアドレスには送信されません。

### ローカルファイル保存

申請書類はDocker volumeの`backend-storage`へ保存され、Backendコンテナを再作成しても保持されます。対応形式はPDF・JPEG・PNG・WebP、1ファイル10MB、申請ごとに合計5ファイルまでです。

## Docker構成

`backend/Dockerfile`はComposer依存解決とPHP 8.4 + Apache実行環境のmulti-stage buildです。DocumentRootはLaravelの`public/`、待受ポートは80です。アプリイメージはmigrationを自動実行しません。デプロイ時に1回限りのECS Task等で次を実行してください。

```bash
php artisan migrate --force
```

`docker-compose.yml`はローカル確認専用で、Backend、MySQL 8.4、MailHogを起動します。

## Backend環境変数

| 変数 | 用途 |
|---|---|
| `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL` | Laravel基本設定。`APP_KEY`は必ずSecrets Manager等から注入 |
| `LOG_CHANNEL`, `LOG_LEVEL` | CloudWatchへ出す場合は`stderr`推奨 |
| `DB_CONNECTION` | `mysql` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Aurora/RDS接続情報 |
| `FILESYSTEM_DISK` | ローカルは`local`、AWSは`s3` |
| `AWS_BUCKET` | 既存Terraformで作成した申請書類用S3バケット名 |
| `MAIL_MAILER` | Docker Composeは`smtp`、AWSは`ses` |
| `MAIL_HOST`, `MAIL_PORT` | ローカルMailHog接続設定。AWSのSES利用時は不要 |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | SESで検証済みの送信元 |
| `AWS_DEFAULT_REGION` | S3・SESリージョン |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | ローカルで必要な場合のみ。ECSでは未設定にしてTask Roleを使用 |
| `SEED_APPLICANT_*`, `SEED_REVIEWER_*` | 任意の初期ユーザー作成用 |

Frontendは同一CloudFront Distributionの`/api/*`を使用するため、AWS固有のAPI URLは不要です。

本番用の設定例は`backend/.env.production.example`にあります。本番URLは`https://waki-cloud-lab.com`、SES送信元は`no-reply@waki-cloud-lab.com`です。認証情報やバケット名は含めていません。

## CI/CD

- Pull Request: Frontend lint/build、Backend test
- `main` push: 上記完了後、FrontendをDEV S3へsyncしてCloudFront invalidation、Backend imageをECRへpushしてDEV ECS Task Definitionを更新
- STG/PROD: `Promote backend image`を手動実行し、DEVで検証済みのcommit SHA imageを再buildせず昇格

GitHub Environments `dev`、`stg`、`prod`へ以下を設定します。STG/PRODには承認ルールを推奨します。

Secret:

- `AWS_ROLE_ARN`: GitHub OIDCでAssumeする環境別IAM Role

Variables:

- 共通Backend: `AWS_REGION`, `ECR_REPOSITORY`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION`, `ECS_CONTAINER_NAME`
- DEV Frontend: `FRONTEND_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`

## AWSデプロイ前の設定

1. CloudFrontの`/*`をS3、`/api/*`をALBへ設定する。
2. `/api/*`は全必要HTTP methodを許可し、`Authorization`/`Accept`/`Content-Type`をALBへ転送し、キャッシュを無効化する。
3. SPAの直接アクセス用にCloudFrontの403/404を`/index.html`へマッピングする。
4. ALB Target Groupのhealth check pathを`/api/health`、success codeを200、ECS container portを80にする。
5. ECS Task DefinitionからDB情報、`APP_KEY`等をSecrets Manager/環境変数で渡し、ログをCloudWatch Logsへ送る。
6. `FILESYSTEM_DISK=s3`と`AWS_BUCKET`を設定し、ECS Task Roleへ申請書類prefixに限定した`GetObject`、`PutObject`、`DeleteObject`権限を付与する。Applicationはバケットを作成しない。
7. `MAIL_MAILER=ses`、`MAIL_FROM_ADDRESS=no-reply@waki-cloud-lab.com`を設定する。ECS Task Roleへ対象identityに限定したSES送信権限を付与し、SESで`waki-cloud-lab.com`ドメインを検証する。SES sandbox中は宛先も検証が必要。
8. Aurora/RDSのDBとユーザーを用意し、ECSからSecurity Group経由で接続可能にする。
9. 初回/各リリース前にmigration用の一時ECS Taskを実行する。常駐Taskの同時起動時migrationは避ける。
10. GitHub OIDC provider/IAM Roleと上記GitHub Environment値を設定する。
11. CloudFrontのAlternate Domain Nameと証明書を`waki-cloud-lab.com`へ設定し、CloudFrontからALBへのHTTPS・オリジン制限を既存Terraform側で確認する。

このリポジトリからTerraform apply、ECR/ECS/S3へのデプロイ、SES実送信は行いません。
