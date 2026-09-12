import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from '../config.js';

export const options = {
  vus: 200,
  duration: '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const token = 'mock-jwt-token-for-load-tests';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. Start Assessment Attempt
  let startRes = http.post(`${BASE_URL}/api/assessments/1/attempt`, {}, { headers });
  check(startRes, { 'start attempt status is 200 or 201': (r) => r.status === 200 || r.status === 201 });
  
  sleep(2); // Read time

  // 2. Answer Questions
  for (let i = 1; i <= 5; i++) {
    let answerPayload = JSON.stringify({ questionId: i, answer: 'Option A' });
    let ansRes = http.post(`${BASE_URL}/api/assessments/attempt/1/answers`, answerPayload, { headers });
    check(ansRes, { 'answer submission status is 200': (r) => r.status === 200 });
    sleep(1); // Time between answers
  }

  // 3. Submit Assessment
  let submitRes = http.post(`${BASE_URL}/api/assessments/attempt/1/submit`, {}, { headers });
  check(submitRes, { 'submit assessment status is 200': (r) => r.status === 200 });

  sleep(1);
}
