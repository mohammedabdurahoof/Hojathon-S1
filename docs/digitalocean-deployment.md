# DigitalOcean Deployment Guide

This guide covers deploying the AI Remedial Learning Platform on DigitalOcean using a Docker-compose architecture.

## Server Sizing Recommendations
- **Minimum**: 4GB RAM, 2 vCPUs (Suitable for staging or very low traffic).
- **Recommended**: 8GB RAM, 4 vCPUs (Suitable for production combining API, Web, and Workers).
- **Database**: Managed PostgreSQL (2GB RAM minimum, 4GB recommended).
- **Cache/Queue**: Managed Redis (1GB RAM minimum).

## Managed Services Setup (Optional but Recommended)
### Managed PostgreSQL
1. Create a Database Cluster in DO. Engine: PostgreSQL 15+.
2. Ensure `pgvector` extension is supported/enabled.
3. Add your Droplet's VPC IP to the trusted sources.
4. Copy the connection string.

### Managed Redis
1. Create a Redis Database Cluster in DO.
2. Add your Droplet's VPC IP to the trusted sources.
3. Copy the connection string.

### Spaces (S3-Compatible Object Storage)
1. Create a Space. Choose the same region as your Droplet.
2. Generate an Access Key and Secret Key in the API section.
3. Note the endpoint URL.

## Droplet Provisioning & Setup
1. Create a Droplet: Ubuntu 22.04 LTS.
2. Add SSH Keys for access.
3. SSH into the server:
   ```bash
   ssh root@<DROPLET_IP>
   ```
4. Install Docker and Docker Compose:
   ```bash
   apt update
   apt install -y apt-transport-https ca-certificates curl software-properties-common
   curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
   add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable"
   apt install -y docker-ce docker-compose-plugin nginx certbot python3-certbot-nginx
   ```

## UFW Firewall Configuration
Lock down the server to only necessary ports.
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## Environment Variable Setup
Create a `.env` file on the server in the deployment directory (`/opt/platform`).
```bash
mkdir -p /opt/platform
nano /opt/platform/.env
```
Populate it with production values:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
REDIS_URL=rediss://default:pass@host:port
JWT_SECRET=super_secure_random_string
OPENAI_API_KEY=sk-....
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_BUCKET=my-bucket
```

## Domain and DNS Setup
1. Point your domain A records to the Droplet IP:
   - `yourdomain.com` (Frontend)
   - `api.yourdomain.com` (API)

## Nginx and SSL Configuration
Configure Nginx as a reverse proxy. Create configurations in `/etc/nginx/sites-available/`.

### SSL with Certbot
```bash
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

## First Deployment Steps
1. Clone the repository or upload your `docker-compose.yml`.
2. Authenticate with your container registry if using pre-built images.
3. Pull and run:
   ```bash
   cd /opt/platform
   docker compose pull
   docker compose run --rm api npx prisma migrate deploy
   docker compose up -d
   ```

## GitHub Actions Secrets
If using CI/CD, set the following repository secrets:
- `DO_SSH_KEY`
- `DO_HOST`
- `DO_USER`
- `REGISTRY_TOKEN` (DockerHub / GHCR token)

## Verification
1. Check container status: `docker ps`
2. Check API health: `curl https://api.yourdomain.com/health`
3. Visit `https://yourdomain.com` in a browser.
