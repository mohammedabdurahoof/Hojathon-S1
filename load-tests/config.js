import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

export const stages = [
  { duration: '30s', target: 100 },  // 0 -> 100
  { duration: '1m', target: 500 },   // 100 -> 500
  { duration: '2m', target: 1000 },  // 500 -> 1000
  { duration: '3m', target: 1000 },  // Hold 1000
  { duration: '1m', target: 0 },     // 1000 -> 0
];

export const thresholds = {
  http_req_failed: ['rate<0.01'], // < 1% errors
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
};

export function getAuthToken(email, password) {
  const payload = JSON.stringify({ email, password });
  const headers = { 'Content-Type': 'application/json' };
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, { headers });
  
  if (res.status === 200) {
    return JSON.parse(res.body).accessToken;
  }
  return null;
}
