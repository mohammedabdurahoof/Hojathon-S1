# Production Checklist

Use this checklist for every production deployment to ensure stability and minimize downtime.

## 1. Before Deployment
- [ ] **Environment Variables**: New variables added to `.env` on the server and CI/CD secrets.
- [ ] **Secrets Rotation**: Ensure no exposed secrets exist; rotate if necessary.
- [ ] **Database Backup**: Manual snapshot or `pg_dump` taken.
- [ ] **Migrations Reviewed**: `prisma/migrations` reviewed for locking operations, data loss risks, or heavy index creation.
- [ ] **CI Pipeline Passes**: All unit, integration, and lint tests green.
- [ ] **Docker Images Built**: Images successfully built, tagged with version/SHA, and pushed to registry.
- [ ] **Nginx Configured**: Any new route requirements or subdomains mapped in Nginx.
- [ ] **SSL Certificates Valid**: Certbot certificates auto-renewing or valid for >30 days.

## 2. During Deployment
- [ ] **Pre-deploy Script**: `pre-deploy-check.sh` executed and passes.
- [ ] **Database Migrations**: `docker compose run --rm api npx prisma migrate deploy` completes without errors.
- [ ] **Container Startup**: `docker compose up -d` executes successfully.
- [ ] **Health Checks Pass**: `/health` returns `200 OK` indicating DB and Redis connections are live.
- [ ] **Smoke Tests Pass**: Manual or automated tests on critical paths (Login, Create User, View Dashboard).
- [ ] **Monitoring Checked**: No sudden spikes in CPU/Memory or error logs upon startup.

## 3. After Deployment
- [ ] **Performance Metrics**: API latencies and system metrics appear normal.
- [ ] **Error Rate Check**: Application error rate remains `< 1%`.
- [ ] **Queue Workers Alive**: BullMQ workers are consuming jobs without failing (check Redis/logs).
- [ ] **Redis Connected**: Cache hits and rate limiting functioning.
- [ ] **Logs Clean**: No unexpected `ERROR` or `WARN` entries in standard out.
- [ ] **Rollback Ready**: Verified that the previous Docker image tag is available if needed.

## Rollback Procedure
If the deployment fails or introduces critical bugs, execute the following immediately.

**1. Rollback Docker Images**
```bash
cd /opt/platform
# Edit docker-compose.yml or .env to point to the PREVIOUS image tag
nano .env # e.g., APP_VERSION=v1.0.4 -> APP_VERSION=v1.0.3

# Pull the previous version and restart
docker compose pull
docker compose up -d --force-recreate
```

**2. Database Rollback (If needed and feasible)**
*Warning: Prisma does not support automated down migrations. Restoring from backup is often required if schema changes are destructive.*
```bash
# Drop current public schema and recreate (DESTRUCTIVE)
docker compose exec -T postgres psql -U user -d dbname -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Restore from pre-deployment backup
cat pre_deploy_backup.sql | docker compose exec -T postgres psql -U user -d dbname
```

**3. Verify Rollback**
```bash
curl https://api.yourdomain.com/health
docker compose logs --tail=100 -f
```
