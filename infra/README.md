# AWS Production Deployment Guide (DSA Tracker)

This folder contains deployment artifacts for a production ECS Fargate setup intended for ~50k active users.

Scope: infrastructure-as-code files and CI/CD workflow only. No direct AWS API calls are made from local setup.

## 1. Prerequisites

- AWS account with permissions for ECR, ECS, EC2, IAM, CloudWatch Logs, CloudFront, ElastiCache, and Secrets Manager.
- GitHub repository admin access for Actions secrets/variables.
- Installed tools:
  - AWS CLI v2 (`aws --version`)
  - Docker (`docker --version`)
  - Node.js 20+
  - pnpm 9+
- Existing VPC with at least 2 public subnets (ALB) and 2 private subnets (ECS/Redis).

## 2. Create Core AWS Resources

### 2.1 ECR Repositories

Create two private ECR repos:

- `dsa-tracker-api`
- `dsa-tracker-web`

The workflow tags images as `${GITHUB_SHA::7}` and pushes to `${ECR_REGISTRY}/dsa-tracker-api` and `${ECR_REGISTRY}/dsa-tracker-web`.

### 2.2 CloudWatch Log Groups

Create:

- `/ecs/dsa-tracker-api`
- `/ecs/dsa-tracker-web`

Set retention to at least 30 days for production troubleshooting.

### 2.3 IAM Roles

Create:

- ECS task execution role (pull image, write logs, read secrets)
- ECS task role (runtime app permissions, least privilege)

Grant `secretsmanager:GetSecretValue` on the API secret to both where needed.

### 2.4 ECS Cluster and Services

Create an ECS Fargate cluster (for example `dsa-tracker-prod`).

Create services:

- API service (task definition family `dsa-tracker-api`)
- Web service (task definition family `dsa-tracker-web`)

Deployment strategy:

- Rolling update (ECS default)
- Minimum healthy percent: 100
- Maximum percent: 200

### 2.5 ALB and Target Groups

Create one internet-facing ALB across at least 2 AZs.

Create target groups:

- `dsa-api-tg` on port 5000, health check path `/api/health`
- `dsa-web-tg` on port 3000, health check path `/`

ALB listener rules:

- `/api/*` -> API target group
- `/*` -> Web target group

### 2.6 Security Groups

- ALB SG: allow 80/443 from internet.
- ECS SG: allow inbound 5000/3000 only from ALB SG.
- Redis SG: allow inbound 6379 only from ECS SG.

## 3. MongoDB Atlas M10 (with VPC Peering)

1. Create an Atlas M10 cluster in the same AWS region as ECS.
2. In Atlas, create VPC peering to your AWS VPC.
3. Accept peering request in AWS.
4. Add route table entries in AWS for Atlas CIDR via peering connection.
5. Add reciprocal routes in Atlas.
6. In Atlas Network Access, allow only ECS private CIDRs (avoid `0.0.0.0/0` in production).
7. Create application DB user with least privilege and store the URI in GitHub secret `MONGODB_URI`.

## 4. ElastiCache Redis (t3.micro)

1. Create a Redis replication group with node type `cache.t3.micro`.
2. Place in private subnets, multi-AZ recommended.
3. Disable public access.
4. Attach Redis SG that only allows ECS SG on port 6379.
5. Use in-transit encryption if your runtime and client config support it.
6. Store connection URL in GitHub secret `REDIS_URL`.

## 5. CloudFront in Front of ALB

1. Create a CloudFront distribution with ALB DNS as origin.
2. Use HTTPS-only origin protocol.
3. Configure caching:
   - Static web assets: long TTL.
   - API paths (`/api/*`): low/no cache unless explicitly intended.
4. Forward required headers/cookies for auth flows.
5. Add custom domain + ACM cert (in `us-east-1`) if applicable.

## 6. GitHub Actions Configuration

### 6.1 Required GitHub Secrets

Set these repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `ECR_REGISTRY` (example: `123456789012.dkr.ecr.ap-south-1.amazonaws.com`)
- `MONGODB_URI`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

Optional secrets (if OAuth is enabled):

- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_SECRET`

### 6.2 Required GitHub Repository Variables

Set these repository variables:

- `ECS_CLUSTER`
- `ECS_SERVICE_API`
- `ECS_SERVICE_WEB`
- `ECS_TASK_EXECUTION_ROLE_ARN`
- `ECS_TASK_ROLE_ARN`
- `ALB_DNS_NAME` (example: `my-alb-123.ap-south-1.elb.amazonaws.com`)

Optional variables:

- `API_SECRETS_NAME` (default in workflow: `dsa-tracker/prod/api`)
- `NEXT_PUBLIC_API_URL` (if unset, workflow uses `https://<ALB_DNS_NAME>/api`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CALLBACK_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CALLBACK_URL`
- `CLIENT_URL`
- `COOKIE_DOMAIN`
- `AWS_S3_BUCKET`
- `AWS_SQS_QUEUE_URL`

## 7. Task Definition Files in This Folder

- `ecs-task-api.json`:
  - Fargate CPU 512 / Memory 1024
  - Container port 5000
  - Secrets loaded from AWS Secrets Manager ARN + JSON keys
  - `awslogs` driver

- `ecs-task-web.json`:
  - Fargate CPU 256 / Memory 512
  - Container port 3000
  - `NEXT_PUBLIC_API_URL` set to ALB DNS placeholder
  - `awslogs` driver

The workflow replaces placeholders such as:

- `<ECS_TASK_EXECUTION_ROLE_ARN>`
- `<ECS_TASK_ROLE_ARN>`
- `<AWS_REGION>`
- `<API_SECRETS_ARN>`
- `<ALB_DNS_NAME>`

## 8. First-Time Deploy

1. Merge these files into `main`.
2. Ensure all required GitHub secrets and variables are set.
3. Confirm ECS services already exist and are attached to ALB target groups.
4. Push a commit to `main` (or rerun workflow manually after a no-op commit).
5. Workflow execution order:
   - `pnpm install`
   - `pnpm turbo build`
   - Docker build/push to ECR (api + web)
   - Sync API secret into Secrets Manager
   - Register new task revisions
   - Rolling ECS deploy for API and Web services
6. Verify:
   - ALB target health is healthy
   - `/api/health` returns 200
   - CloudFront distribution serves web and forwards API traffic correctly

## 9. Operational Best Practices

- Keep containers non-root (already configured in app Dockerfiles).
- Rotate JWT and OAuth secrets periodically.
- Enable ECS service auto scaling (CPU and memory target tracking).
- Use separate AWS accounts/environments for staging and production.
- Enable CloudWatch alarms for ECS, ALB 5xx, Redis CPU/memory, and Atlas connection failures.
