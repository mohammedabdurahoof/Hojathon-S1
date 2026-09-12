#!/bin/bash
# To make executable: chmod +x scripts/smoke-test.sh

BASE_URL=${API_URL:-http://localhost:3001}
FAILS=0

echo "Starting smoke tests against $BASE_URL..."

check_test() {
  local name=$1
  local expected=$2
  local actual=$3
  
  if [ "$expected" == "$actual" ]; then
    echo -e "[\033[32mPASS\033[0m] $name (Status: $actual)"
  else
    echo -e "[\033[31mFAIL\033[0m] $name (Expected: $expected, Got: $actual)"
    FAILS=$((FAILS+1))
  fi
}

# 1. Test GET /api/health
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
check_test "GET /api/health" "200" "$status"

# 2. Test GET /api/health/live
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/live")
check_test "GET /api/health/live" "200" "$status"

# 3. Test GET /api/health/ready
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health/ready")
check_test "GET /api/health/ready" "200" "$status"

# 4. Test GET /api/version (Assuming a version endpoint exists, or testing basic root)
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/version")
check_test "GET /api/version" "200" "$status"

# 5. Test POST /api/auth/login with invalid creds
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"email":"invalid@example.com","password":"wrong"}' "$BASE_URL/api/auth/login")
check_test "POST /api/auth/login (invalid creds)" "401" "$status"

# 6. Test GET /api/students without auth
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/students")
check_test "GET /api/students (no auth)" "401" "$status"

echo "----------------------------------------"
if [ $FAILS -gt 0 ]; then
  echo -e "\033[31mSmoke tests failed ($FAILS failures).\033[0m"
  exit 1
else
  echo -e "\033[32mAll smoke tests passed successfully!\033[0m"
  exit 0
fi
