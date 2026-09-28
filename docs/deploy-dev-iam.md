# DEV Backend deployment IAM

The application repository builds the Backend image in `build.yml` and deploys that existing image in `deploy.yml`. Terraform remains responsible for the ECR repository, ECS cluster/service/task definition baseline, IAM roles, load balancer, database, and secrets.

## GitHub Environment variables

Configure these variables in the `dev` GitHub Environment (or as repository variables):

- `AWS_ROLE_ARN`: IAM role assumed by GitHub Actions through OIDC
- `AWS_REGION`: region containing ECR and ECS
- `ECR_REPOSITORY`: ECR repository name, not a registry URL
- `ECS_CLUSTER`: DEV ECS cluster name or ARN
- `ECS_SERVICE`: DEV ECS service name or ARN
- `ECS_CONTAINER`: container name inside the current task definition whose image is updated

No AWS access keys or application/database secrets are stored in GitHub.

## OIDC trust policy

Because the deploy job uses the GitHub Environment named `dev`, restrict the role trust to that environment and repository. Replace the placeholders when Terraform creates the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "<EXACT_GITHUB_OIDC_SUBJECT_FOR_THE_DEV_ENVIRONMENT>"
        }
      }
    }
  ]
}
```

Configure the `dev` Environment deployment branch rule to allow only `main`.

Use the exact `sub` format emitted for the repository. The legacy format is `repo:<GITHUB_ORG>/<GITHUB_REPOSITORY>:environment:dev`. Repositories using GitHub immutable OIDC subjects use `repo:<GITHUB_ORG>@<ORG_ID>/<GITHUB_REPOSITORY>@<REPOSITORY_ID>:environment:dev`. Do not use a wildcard that permits other repositories.

## Minimum deployment permissions

Replace all placeholders with Terraform-managed resource ARNs. `iam:PassRole` must name only the Task Role and Task Execution Role already referenced by the ECS task definition.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrLogin",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "PushAndResolveBackendImage",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:CompleteLayerUpload",
        "ecr:DescribeImages",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:<AWS_REGION>:<AWS_ACCOUNT_ID>:repository/<ECR_REPOSITORY>"
    },
    {
      "Sid": "ReadAndRegisterTaskDefinition",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:ListTaskDefinitions",
        "ecs:RegisterTaskDefinition",
        "ecs:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ObserveEcsServices",
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTasks"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RunDevDatabaseMigration",
      "Effect": "Allow",
      "Action": "ecs:RunTask",
      "Resource": "arn:aws:ecs:<AWS_REGION>:<AWS_ACCOUNT_ID>:task-definition/<ECS_TASK_FAMILY>:*"
    },
    {
      "Sid": "DeployOnlyToDevService",
      "Effect": "Allow",
      "Action": "ecs:UpdateService",
      "Resource": "arn:aws:ecs:<AWS_REGION>:<AWS_ACCOUNT_ID>:service/<ECS_CLUSTER>/<ECS_SERVICE>"
    },
    {
      "Sid": "PassOnlyExistingEcsRoles",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ECS_TASK_ROLE>",
        "arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ECS_TASK_EXECUTION_ROLE>"
      ],
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "ecs-tasks.amazonaws.com"
        }
      }
    }
  ]
}
```

## Runtime configuration ownership

Terraform/ECS Task Definition supplies environment-specific Laravel settings, including `APP_ENV=dev`, `APP_PORT=8080`, database host/name/charset/timezone, log configuration, the documents bucket, and Secrets Manager references for `APP_KEY` and the database username/password. The container receives no long-lived AWS access keys; AWS access is provided by the Task Role and secrets are fetched through the Task Execution Role.

Terraform creates the initial DEV ECS Service with desired count `0`, so infrastructure creation does not depend on an existing image. After an image is pushed, `deploy.yml` runs `php artisan migrate --force` as a one-off Fargate task. Only a successful migration updates the Service to the digest-pinned Task Definition and desired count `1`.
