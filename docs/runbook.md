# Operations Runbook

This runbook provides exact shell commands for common administrative and operational tasks.

## Deployment & Versioning
**Deploy latest version:**
```bash
cd /opt/platform
docker compose pull
docker compose up -d
```

**Deploy specific version:**
```bash
# Update .env or docker-compose.yml to specify tag, e.g., image: myapp:v1.2.0
docker compose pull
docker compose up -d
```

**Rollback to previous image tag:**
```bash
# Edit tag in config
docker compose up -d --force-recreate
```

## Service Management
**Restart API / Worker / Web containers:**
```bash
docker compose restart api
docker compose restart worker
docker compose restart web
```

**Scale workers horizontally:**
```bash
docker compose up -d --scale worker=3
```

## Logging & Monitoring
**View logs (tailing):**
```bash
docker compose logs -f api
docker compose logs -f worker
```

**Filter logs by level (if using JSON logs or standard tags):**
```bash
docker compose logs api | grep "ERROR"
```

**Check API health:**
```bash
curl -I https://api.yourdomain.com/health
```

## Database Management
**Run migration manually:**
```bash
docker compose run --rm api npx prisma migrate deploy
```

**Check DB connections:**
```bash
docker compose exec postgres psql -U user -d dbname -c "SELECT count(*) FROM pg_stat_activity;"
```

**Backup now:**
```bash
docker compose exec -T postgres pg_dump -U user dbname > /opt/platform/manual_backup_$(date +%F).sql
```

**Restore from backup:**
```bash
cat manual_backup.sql | docker compose exec -T postgres psql -U user -d dbname
```

## Redis & Queue Management
**Check queue depth (via Redis CLI):**
```bash
# Counts items in a specific BullMQ list
docker compose exec redis redis-cli LLEN bull:my-queue:wait
```

**Check Redis memory usage:**
```bash
docker compose exec redis redis-cli INFO memory | grep used_memory_human
```

## Security & Maintenance
**Rotate JWT secrets:**
1. Generate new secret: `openssl rand -hex 32`
2. Update `JWT_SECRET` in `.env`
3. Restart API: `docker compose restart api`

**Renew TLS certificate (Nginx):**
```bash
certbot renew
nginx -s reload
```

**Check system resources (Disk / Memory / CPU):**
```bash
df -h          # Disk
free -m        # Memory
htop           # CPU/Processes (install with apt install htop)
docker stats   # Container specific stats
```
