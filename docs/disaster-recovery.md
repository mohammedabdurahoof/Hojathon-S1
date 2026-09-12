# Disaster Recovery Plan

## Recovery Objectives
- **Recovery Point Objective (RPO)**: 24 hours (Max data loss accepted, based on daily backups).
- **Recovery Time Objective (RTO)**: 4 hours (Time to restore services completely from a total failure).

## Scenarios & Recovery Procedures

### 1. Database Complete Failure
*Scenario: Primary PostgreSQL instance crashes unrecoverably or data volume is destroyed.*
- **Step 1: Provision New DB**: Spin up a new PostgreSQL instance (or DO Managed DB).
- **Step 2: Fetch Latest Backup**: Download the latest backup from DigitalOcean Spaces.
  ```bash
  s3cmd get s3://my-bucket/backups/db_backup_latest.sql.gz ./
  ```
- **Step 3: Extract and Restore**:
  ```bash
  gunzip db_backup_latest.sql.gz
  psql -U your_user -h your_new_host -d your_db < db_backup_latest.sql
  ```
- **Step 4: Update Connection Strings**: Update `.env` with the new `DATABASE_URL` and restart containers.
  ```bash
  docker compose restart api worker
  ```

### 2. Redis Failure
*Scenario: Redis instance crashes or data is corrupted.*
- **Impact**: Sessions might drop, cached data is lost, background jobs in queue might be lost. System degrades gracefully (API functions, but slow; queue jobs fail).
- **Step 1: Restart/Provision Redis**: Restart the Redis container or provision a new Managed Redis.
  ```bash
  docker compose restart redis
  ```
- **Step 2: Flush Corrupt Data (If needed)**:
  ```bash
  docker compose exec redis redis-cli FLUSHALL
  ```
- **Step 3**: The application will automatically rebuild caches as traffic arrives.

### 3. Application Server Failure
*Scenario: The Droplet hosting Docker containers becomes unresponsive or fails.*
- **Step 1: Provision New Droplet**: Deploy a new Ubuntu 22.04 Droplet using a pre-configured image or standard setup.
- **Step 2: Reattach Floating IP / DNS**: Point the domain/Floating IP to the new Droplet.
- **Step 3: Deploy Application**:
  ```bash
  git clone <repo> /opt/platform
  # Copy .env from secure vault (e.g., 1Password, Vault)
  cd /opt/platform
  docker compose up -d
  ```

### 4. Complete Datacenter Failure
*Scenario: DigitalOcean region goes offline.*
- **Step 1**: Identify alternate DO region or fallback cloud provider (e.g., AWS).
- **Step 2**: Provision new infrastructure (Droplet, DB) in the new region.
- **Step 3**: Restore DB from cross-region Spaces backup.
- **Step 4**: Update global DNS via Cloudflare to point to the new infrastructure.

### 5. Database Corruption
*Scenario: Bad migration or application bug corrupts critical tables.*
- **Step 1**: Put application in Maintenance Mode (configure Nginx to return 503).
- **Step 2**: Create a snapshot of the corrupted database for forensics.
- **Step 3**: Restore the database from the last known good backup (see DB Failure steps).
- **Step 4**: Apply safe migrations if needed.
- **Step 5**: Disable Maintenance Mode.

## Backup Verification Procedure
Monthly verification required:
1. Download a random daily backup.
2. Restore to a local or staging PostgreSQL instance.
3. Run `npx prisma db pull` and verify schema matches.
4. Run sample queries to verify data integrity.

## Escalation Contacts
| Role | Name | Phone | Email |
|---|---|---|---|
| Primary On-Call | [Name] | [Phone] | [Email] |
| Lead Engineer | [Name] | [Phone] | [Email] |
| SysAdmin/DevOps | [Name] | [Phone] | [Email] |
