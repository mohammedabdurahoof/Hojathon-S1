# Load Testing

Load testing ensures the AI Remedial Learning Platform can handle the target capacity (10k students, 1k concurrent users). We use **k6** for performance testing.

## k6 Installation
- **macOS**: `brew install k6`
- **Linux (Debian/Ubuntu)**:
  ```bash
  sudo gpg -k
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

## How to Run Scenarios
Navigate to the performance testing directory (e.g., `tests/performance`) and execute a script:
```bash
k6 run spike_test.js
k6 run load_test.js --out json=results.json
```

## Test Configuration (Stages & Thresholds)
A standard load test script (`load_test.js`) should look like this:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 200 }, // Ramp-up to 200 users over 2 mins
    { duration: '5m', target: 200 }, // Stay at 200 users for 5 mins
    { duration: '2m', target: 1000 }, // Ramp-up to 1000 users over 2 mins (Peak)
    { duration: '5m', target: 1000 }, // Stay at peak
    { duration: '2m', target: 0 },   // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

export default function () {
  let res = http.get('https://api.yourdomain.com/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

## Success Criteria
For a system to be considered "healthy" under load:
1. **Error Rate**: `< 1%` (HTTP 5xx or timeouts).
2. **Latency**: `p95 < 500ms` for standard API routes (AI routes excluded, as they are async).
3. **Connections**: No DB connection pool exhaustion (Prisma handles pooling, ensure `connection_limit` is adequate).
4. **Resources**: Server CPU/Memory should not sustain 100% leading to crashes.

## Interpreting Results
k6 outputs metrics upon completion:
- `http_req_duration`: Overall response time. Look at `avg` and `p(95)`.
- `http_req_failed`: Percentage of failed requests.
- `vus`: Virtual Users active during the test.

## Results Template Table
Record benchmark results here:

| Date | Scenario | Max VUs | p95 Latency | Error Rate | Bottlenecks Identified |
|---|---|---|---|---|---|
| 2024-05-01 | Base API | 500 | 120ms | 0.00% | None |
| | | | | | |

## Identifying and Diagnosing Failures
- **High Error Rate (502/503/504)**: Nginx dropping connections or API containers crashing. Check `docker logs api`.
- **High Latency, Low CPU**: Likely database bottleneck (missing index, locks, or connection pool exhaustion). Check `pg_stat_activity`.
- **High Latency, High CPU**: Node.js thread blocking. Look for synchronous heavy operations (crypto, parsing) or unoptimized loops.

## Common Bottlenecks and Fixes
- **Prisma Connection Exhaustion**: Increase connection pool size in `DATABASE_URL` (`?connection_limit=50`) or implement PgBouncer.
- **Node.js Single Thread Limits**: Scale API containers horizontally.
- **Read-heavy DB load**: Implement Redis caching for static/rarely-changing data.
