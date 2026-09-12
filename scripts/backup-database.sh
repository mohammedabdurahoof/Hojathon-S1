#!/bin/bash
# To make executable: chmod +x scripts/backup-database.sh

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

# Generate backup filename
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql.gz"
TEMP_FILE="/tmp/$BACKUP_FILE"

echo "Starting database backup to $TEMP_FILE..."

# Create dump and compress
pg_dump "$DATABASE_URL" | gzip > "$TEMP_FILE"

if [ $? -eq 0 ]; then
  echo "Database backup created successfully."
else
  echo "Error: Database backup failed."
  rm -f "$TEMP_FILE"
  exit 1
fi

echo "Uploading backup to S3..."
# Upload to S3
aws s3 cp "$TEMP_FILE" "s3://$BACKUP_S3_BUCKET/postgres/$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup successfully uploaded to S3: s3://$BACKUP_S3_BUCKET/postgres/$BACKUP_FILE"
else
  echo "Error: Failed to upload backup to S3."
  rm -f "$TEMP_FILE"
  exit 1
fi

# Cleanup local temp file
rm -f "$TEMP_FILE"
echo "Cleaned up local temp file."

echo "Cleaning up S3 backups older than 30 days..."
# List and delete old backups in S3
aws s3 ls "s3://$BACKUP_S3_BUCKET/postgres/" | while read -r line; do
  create_date=$(echo "$line" | awk '{print $1" "$2}')
  create_timestamp=$(date -d "$create_date" +%s)
  current_timestamp=$(date +%s)
  age_days=$(( (current_timestamp - create_timestamp) / 86400 ))
  
  if [ "$age_days" -gt 30 ]; then
    file_name=$(echo "$line" | awk '{print $4}')
    if [ -n "$file_name" ]; then
      echo "Deleting old backup: $file_name"
      aws s3 rm "s3://$BACKUP_S3_BUCKET/postgres/$file_name"
    fi
  fi
done

echo "Backup process completed successfully."
exit 0
