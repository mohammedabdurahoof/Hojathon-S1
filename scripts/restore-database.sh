#!/bin/bash
# To make executable: chmod +x scripts/restore-database.sh

set -e

# Load environment variables
if [ -f .env.production ]; then
  export $(grep -v '^#' .env.production | xargs)
fi

# Validate credentials
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

if [ -z "$BACKUP_S3_BUCKET" ]; then
  echo "Error: BACKUP_S3_BUCKET is not set"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Error: Please provide a backup filename or 'latest' as an argument."
  echo "Usage: ./restore-database.sh <backup-filename | latest>"
  exit 1
fi

TARGET_BACKUP=$1

if [ "$TARGET_BACKUP" == "latest" ]; then
  echo "Finding most recent backup in S3..."
  LATEST_FILE=$(aws s3 ls "s3://$BACKUP_S3_BUCKET/postgres/" | sort | tail -n 1 | awk '{print $4}')
  
  if [ -z "$LATEST_FILE" ]; then
    echo "Error: No backups found in S3 bucket."
    exit 1
  fi
  
  TARGET_BACKUP=$LATEST_FILE
  echo "Found latest backup: $TARGET_BACKUP"
fi

TEMP_FILE="/tmp/$TARGET_BACKUP"

echo "Downloading $TARGET_BACKUP from S3..."
aws s3 cp "s3://$BACKUP_S3_BUCKET/postgres/$TARGET_BACKUP" "$TEMP_FILE"

if [ $? -ne 0 ]; then
  echo "Error: Failed to download backup from S3."
  exit 1
fi

if [ "$FORCE" != "true" ]; then
  read -p "Are you sure you want to restore $TARGET_BACKUP? This will overwrite the current database. (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    rm -f "$TEMP_FILE"
    exit 0
  fi
fi

echo "Starting database restore..."

# Drop all connections and recreate public schema (or drop DB, but schema drop is safer for managed DBs)
# Note: For full DB restores, you might need superuser access or a specific restore temp DB process.
# We'll use a simple clean command.
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restoring data..."
gunzip -c "$TEMP_FILE" | psql "$DATABASE_URL"

if [ $? -eq 0 ]; then
  echo "Database restored successfully."
else
  echo "Error: Database restore failed."
  rm -f "$TEMP_FILE"
  exit 1
fi

echo "Verifying restore..."
psql "$DATABASE_URL" -c "SELECT count(*) FROM \"User\";"

# Cleanup
rm -f "$TEMP_FILE"
echo "Restore process completed."
exit 0
