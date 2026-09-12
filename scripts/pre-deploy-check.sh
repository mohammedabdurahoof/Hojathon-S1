#!/bin/bash
# To make executable: chmod +x scripts/pre-deploy-check.sh

set -e

echo "Running Pre-Deploy Checks..."
FAILS=0

check_status() {
  if [ $1 -eq 0 ]; then
    echo -e "[\033[32mPASS\033[0m] $2"
  else
    echo -e "[\033[31mFAIL\033[0m] $2"
    FAILS=$((FAILS+1))
  fi
}

# 1. Check NODE_ENV
if [ "$NODE_ENV" == "production" ]; then
  check_status 0 "NODE_ENV is set to production"
else
  check_status 1 "NODE_ENV is not set to production (current: $NODE_ENV)"
fi

# 2. Check Required Env Vars
REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "JWT_REFRESH_SECRET" "CORS_ORIGINS" "AI_API_KEY")
MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Missing required environment variable: $var"
    MISSING_VARS=1
  fi
done
check_status $MISSING_VARS "All required environment variables are present"

# 3. Check JWT_SECRET length
if [ ${#JWT_SECRET} -ge 32 ]; then
  check_status 0 "JWT_SECRET length is >= 32 characters"
else
  check_status 1 "JWT_SECRET length is less than 32 characters"
fi

# 4. Check git clean status
if [ "$SKIP_GIT_CHECK" == "true" ]; then
  check_status 0 "Git status check skipped (SKIP_GIT_CHECK=true)"
else
  if [ -z "$(git status --porcelain)" ]; then
    check_status 0 "Git working directory is clean"
  else
    check_status 1 "Git working directory has uncommitted changes"
  fi
fi

# 5. Check Prisma pending migrations
echo "Checking for pending migrations..."
npx prisma migrate status > /dev/null 2>&1
MIGRATE_STATUS=$?
check_status $MIGRATE_STATUS "Prisma migrations are up to date"

# 6. Verify build works
echo "Verifying application build..."
npm run build > /dev/null 2>&1
BUILD_STATUS=$?
check_status $BUILD_STATUS "Application builds successfully"

echo "----------------------------------------"
if [ $FAILS -gt 0 ]; then
  echo -e "\033[31mPre-deploy checks failed ($FAILS failures).\033[0m"
  exit 1
else
  echo -e "\033[32mAll pre-deploy checks passed successfully!\033[0m"
  exit 0
fi
