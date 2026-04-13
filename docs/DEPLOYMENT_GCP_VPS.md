# Synapse Deployment Guide (GCP VPS + Docker + GitHub Actions)

## 1) Is the current database schema final?

Short answer: no, it is not final yet.

Current state in this repo:
- You have only the User model implemented at [lib/db/models/User.ts](lib/db/models/User.ts).
- Note and Folder models are still pending (planned in your architecture docs).

That means this is a partial schema suitable for auth bootstrapping, not the final production data model yet.

## 2) Why Atlas shows a database named test

If your MongoDB URI has no database path segment, MongoDB uses test by default.

Example (defaults to test):
- mongodb+srv://user:pass@cluster.mongodb.net/?appName=synapse

Example (uses Synapse):
- mongodb+srv://user:pass@cluster.mongodb.net/Synapse?retryWrites=true&w=majority&appName=synapse

Action:
- Update MONGODB_URI in your env files to include /Synapse (or your intended DB name).

## 3) When should you deploy?

Recommended timeline:
1. Deploy to staging now (good time):
   - MongoDB connection verified
   - Login/signup flow working
   - Build and lint passing
2. Deploy to production after Phase 1 criticals are done:
   - Note + Folder models and core CRUD routes
   - Basic e2e/auth smoke tests
   - Backup and rollback plan in place

Rule of thumb:
- Staging: as soon as auth + DB are stable.
- Production: once core note workflows and tests are stable.

## 4) Files added for deployment

- Docker image definition: [Dockerfile](Dockerfile)
- Docker ignore rules: [.dockerignore](.dockerignore)
- Production compose file: [docker-compose.prod.yml](docker-compose.prod.yml)
- CI/CD pipeline: [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)

## 5) CI/CD pipeline behavior

On pull request to main:
- Install dependencies
- Run lint
- Run build

On push to main:
- Run CI checks
- Build Docker image
- Push image to GHCR
- SSH to GCP VPS
- Pull and restart container with docker compose

## 6) One-time GCP VPS setup

Assumes Ubuntu 22.04 VM.

### 6.1 Install Docker + Compose plugin

Run on VPS:

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
# log out and log back in before continuing

### 6.2 Create deployment directory

mkdir -p /opt/synapse

### 6.3 Create production env file

Create /opt/synapse/.env on VPS with values like:

NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=replace_with_secure_secret
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/Synapse?retryWrites=true&w=majority
GOOGLE_GENERATIVE_AI_API_KEY=

Optional provider vars if used:
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

## 7) GitHub secrets required

Set these in GitHub -> Settings -> Secrets and variables -> Actions:

- VPS_HOST: public IP or domain of VPS
- VPS_PORT: usually 22
- VPS_USER: SSH user on VPS
- VPS_SSH_KEY: private SSH key content
- VPS_APP_DIR: deployment directory, e.g. /opt/synapse
- VPS_GHCR_USERNAME: account that can pull GHCR image
- VPS_GHCR_TOKEN: token with read:packages permission

Notes:
- The workflow uses GITHUB_TOKEN to push image to GHCR.
- The VPS uses VPS_GHCR_USERNAME + VPS_GHCR_TOKEN to pull the image.

## 8) First deployment flow

1. Push to main.
2. Watch GitHub Actions run CI-CD workflow.
3. On VPS, verify container is running:

cd /opt/synapse
docker compose -f docker-compose.prod.yml ps

4. Check app logs:

docker compose -f docker-compose.prod.yml logs -f app

## 9) Rollback strategy

Quick rollback to a previous image tag:

cd /opt/synapse
export IMAGE=ghcr.io/<owner>/synapse:<previous_commit_sha>
docker compose -f docker-compose.prod.yml up -d --remove-orphans

## 10) Recommended next hardening

1. Put app behind Nginx or Caddy with HTTPS (LetsEncrypt).
2. Add uptime health checks and alerting.
3. Add integration tests for login/signup and DB operations.
4. Add nightly MongoDB backup/export job.
5. Remove unintended dependency entries (for example mongose if not needed).
