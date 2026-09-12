# Incident Response Plan

This document outlines the standard operating procedures for handling production incidents.

## 1. Database Unavailable
- **Detection**: API returns 500s; logs show `PrismaClientInitializationError` or connection timeouts; `/health` fails.
- **Immediate Action**: Check database server status in DigitalOcean console.
- **Mitigation**: If overloaded, scale DB resources. If crashed, attempt a restart. Implement maintenance page if prolonged.
- **Recovery**: If unrecoverable, initiate Disaster Recovery DB Restore procedure. Update connection strings if moved.
- **Postmortem**: Why did it fail? (OOM, Disk full, CPU spike, network). Add metrics/alerts to detect earlier.

## 2. Redis Unavailable
- **Detection**: BullMQ errors in logs, rate limiting fails (API open or blocked), cache read timeouts.
- **Immediate Action**: `docker compose restart redis` or check Managed Redis status.
- **Mitigation**: App should gracefully fallback to DB for reads if programmed to. Clear `FLUSHALL` if out of memory.
- **Recovery**: Provision more RAM for Redis. Implement maxmemory policies (`allkeys-lru`).
- **Postmortem**: Analyze key sizes and TTLs. Fix missing TTLs on cache entries.

## 3. AI Provider Unavailable (OpenAI Down)
- **Detection**: API timeouts on AI-related endpoints; BullMQ jobs failing and entering Dead Letter Queue (DLQ); OpenAI status page indicates outage.
- **Immediate Action**: Pause queue processing to prevent job exhaustion.
  ```bash
  # Example: Pause worker processing via custom admin endpoint or CLI
  ```
- **Mitigation**: Update UI to inform users that AI features are temporarily degraded.
- **Recovery**: Once OpenAI is restored, resume queues and manually retry failed jobs from DLQ.
- **Postmortem**: Implement circuit breakers for third-party APIs. Evaluate fallback AI providers (e.g., Anthropic, local LLM).

## 4. Queue Failure/Backlog
- **Detection**: Redis memory spikes; Queue depth metric > 10,000; Users report delayed AI results or missing emails.
- **Immediate Action**: Check worker container logs. `docker compose logs --tail=100 -f worker`
- **Mitigation**: Scale workers horizontally: `docker compose up -d --scale worker=4`.
- **Recovery**: Clear stuck/zombie jobs if a specific payload is crashing workers.
- **Postmortem**: Optimize worker code. Add dead-letter handling.

## 5. High API Latency (> 2s p95)
- **Detection**: APM tools alert; Nginx access logs show slow response times.
- **Immediate Action**: Identify the specific slow endpoints via logs.
- **Mitigation**: Temporarily disable expensive features (e.g., heavy analytics dashboards).
- **Recovery**: Add database indexes; implement Redis caching for the slow endpoint; optimize Prisma queries (remove N+1).
- **Postmortem**: Add the endpoint to load testing suite to prevent regression.

## 6. Memory Exhaustion (OOM)
- **Detection**: Containers restarting frequently (Exit Code 137); Server unresponsive via SSH.
- **Immediate Action**: Restart affected containers to clear memory.
- **Mitigation**: Increase Droplet RAM or adjust Node.js memory limits (`--max-old-space-size`).
- **Recovery**: Profile application for memory leaks (e.g., unclosed DB connections, unbounded arrays).
- **Postmortem**: Implement strict memory limits in Docker compose (`mem_limit`).

## 7. Disk Full
- **Detection**: DB writes fail, logging fails, cannot upload files.
- **Immediate Action**: Clean up Docker logs and unused images.
  ```bash
  docker system prune -af
  truncate -s 0 /var/lib/docker/containers/*/*-json.log
  ```
- **Mitigation**: Add block storage volume or resize Droplet.
- **Recovery**: Move logs to external service (e.g., Datadog, CloudWatch); implement log rotation in Docker.
- **Postmortem**: Set up disk usage alerts at 80% capacity.

## 8. SSL Certificate Expiry
- **Detection**: Users see browser security warnings; uptime monitors fail due to SSL errors.
- **Immediate Action**: Manually renew cert via Certbot.
  ```bash
  certbot renew --force-renewal
  systemctl reload nginx
  ```
- **Mitigation**: N/A
- **Recovery**: Ensure successful renewal and test via browser.
- **Postmortem**: Fix certbot cron job/timer. Monitor certificate expiry externally.

## 9. Security Incident / Data Breach
- **Detection**: Unusual access patterns; reported vulnerabilities; unexpected admin accounts created.
- **Immediate Action**: Disconnect affected systems from network. Rotate ALL secrets (DB, JWT, APIs). Revoke all active sessions.
- **Mitigation**: Patch the vulnerability immediately.
- **Recovery**: Restore clean data from backup if tampered with.
- **Postmortem**: Full forensic audit. Comply with legal notification requirements (GDPR, etc.).

## 10. Bad Deployment (Immediate Rollback Needed)
- **Detection**: Pre/Post deploy checks fail; spike in 500 errors immediately after deploy.
- **Immediate Action**: Follow Rollback Procedure in `production-checklist.md`.
- **Mitigation**: Revert code in `main` branch.
- **Recovery**: Deploy known good image.
- **Postmortem**: Why did CI/CD pass? Improve test coverage.

## 11. Database Migration Failure
- **Detection**: `prisma migrate deploy` fails during deployment.
- **Immediate Action**: Do not proceed with container restart.
- **Mitigation**: Identify the failing SQL statement.
- **Recovery**: Restore from pre-deploy backup if schema is in an inconsistent state. Fix migration script and retry.
- **Postmortem**: Always test migrations on a staging replica containing production-like data volumes.
