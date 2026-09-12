# Security Policies and Architecture

This document outlines the security mechanisms protecting the AI Remedial Learning Platform.

## Authentication
- **Mechanism**: JSON Web Tokens (JWT) for stateless authentication.
- **Storage**: Passwords are cryptographically hashed using **bcrypt** with a minimum cost factor of 10.
- **Flow**: Login returns an Access Token (short-lived) and optionally a Refresh Token (long-lived, HttpOnly cookie).

## Authorization (RBAC)
- **Roles**: System utilizes Role-Based Access Control (Student, Teacher, Admin).
- **Ownership Checks**: Resources (like test submissions or profiles) are strictly checked against the authenticated user's ID to prevent **IDOR (Insecure Direct Object Reference)**.
- **Guards**: NestJS `@Roles()` decorators and strict Guards ensure endpoints are only accessible by authorized roles.

## Rate Limiting
API routes are protected against abuse and brute-force attacks via Redis-backed rate limiting.
- **Public Routes**: 100 req / 15 mins.
- **Auth Routes (Login/Register)**: 10 req / 15 mins (Prevents credential stuffing).
- **AI Routes**: Strict quotas based on user tier to prevent cost overruns.

## CORS Policy
Cross-Origin Resource Sharing is strictly configured.
- Allowed Origins: Exact frontend domains (e.g., `https://yourdomain.com`).
- Allowed Methods: `GET, POST, PUT, DELETE, OPTIONS`.
- Credentials: `true` (if using cookies for sessions/refresh tokens).

## Security Headers (Helmet)
NestJS uses `helmet` to automatically inject standard security headers:
- `Strict-Transport-Security (HSTS)`: Forces HTTPS.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing.
- `X-Frame-Options: DENY`: Prevents Clickjacking.
- `Content-Security-Policy (CSP)`: Restricts script execution sources.

## Assessment Security
- **Server-Side Scoring**: All grading and evaluation logic happens securely on the server or via the AI Provider.
- **No Client Trust**: The frontend is treated as untrusted. Payload data is strictly validated using `class-validator` DTOs before processing.

## AI Prompt Injection Protection
- **System Prompts**: Hardcoded system boundaries instruct the LLM to ignore user instructions that attempt to alter its primary persona or task.
- **Input Sanitization**: User inputs are stripped of control characters and unusually long payloads are truncated before being sent to the AI.

## Data Privacy Principles
- **PII minimization**: Collect only necessary student data.
- **Encryption**: Data is encrypted in transit (TLS 1.2+) and at rest (DigitalOcean block storage encryption).
- **Soft Deletes**: Implemented where necessary, but full data wiping (Right to be Forgotten) scripts are available for GDPR compliance.

## Audit Logging
- Critical actions (user creation, role changes, password resets, bulk deletions) are logged with User ID, Timestamp, IP address, and Action type for forensic review.

## Infrastructure Security
- **Dependency Security**: `npm audit` run in CI/CD pipeline. Dependabot enabled on GitHub.
- **Container Security**: Docker containers run as non-root users (`USER node`). Images are based on slim/alpine variants to reduce attack surface.
- **Server Hardening**: UFW firewall restricts traffic to 80/443/22. SSH access is Key-Based ONLY, password authentication disabled.

## Reporting Vulnerabilities
Security vulnerabilities should be reported directly to `security@yourdomain.com` and not disclosed publicly until patched.
