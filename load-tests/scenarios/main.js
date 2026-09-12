import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, stages, thresholds, getAuthToken } from '../config.js';

export const options = {
  stages,
  thresholds,
};

export default function () {
  // Mock auth for load test (in real scenario, use actual credentials or seeded test users)
  // const token = getAuthToken(`user_${__VU}@example.com`, 'password123');
  const token = 'mock-jwt-token-for-load-tests';
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const rand = Math.random();

  if (rand < 0.40) {
    // 40% Student Dashboard
    let res = http.get(`${BASE_URL}/api/students/dashboard`, { headers });
    check(res, { 'dashboard status is 200': (r) => r.status === 200 });
    
  } else if (rand < 0.60) {
    // 20% Assessment
    let res = http.get(`${BASE_URL}/api/assessments/available`, { headers });
    check(res, { 'assessments status is 200': (r) => r.status === 200 });
    
  } else if (rand < 0.75) {
    // 15% AI Tutor
    let payload = JSON.stringify({ message: 'Explain photosynthesis' });
    let res = http.post(`${BASE_URL}/api/ai/chat`, payload, { headers });
    check(res, { 'ai chat status is 200': (r) => r.status === 200 });
    
  } else if (rand < 0.85) {
    // 10% Practice
    let res = http.get(`${BASE_URL}/api/practice/sessions`, { headers });
    check(res, { 'practice sessions status is 200': (r) => r.status === 200 });
    
  } else if (rand < 0.95) {
    // 10% Teacher Analytics
    let res = http.get(`${BASE_URL}/api/teachers/analytics`, { headers });
    check(res, { 'analytics status is 200': (r) => r.status === 200 });
    
  } else {
    // 5% Auth (Login simulation)
    let payload = JSON.stringify({ email: `user_${__VU}@example.com`, password: 'password123' });
    let res = http.post(`${BASE_URL}/api/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    check(res, { 'login status is 200 or 401': (r) => r.status === 200 || r.status === 401 });
  }

  sleep(1);
}
