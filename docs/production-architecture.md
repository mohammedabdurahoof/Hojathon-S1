# Production Architecture

## Architecture Diagram

```mermaid
graph TD
    %% Define Node Styles
    classDef client fill:#f9f,stroke:#333,stroke-width:2px;
    classDef gateway fill:#bbf,stroke:#333,stroke-width:2px;
    classDef compute fill:#dfd,stroke:#333,stroke-width:2px;
    classDef db fill:#fdb,stroke:#333,stroke-width:2px;
    classDef ext fill:#ddd,stroke:#333,stroke-width:2px;

    %% Nodes
    User(("User/Student\n(Internet)")):::client
    DNS["Cloudflare DNS\n& WAF"]:::gateway
    Nginx["Nginx Reverse Proxy\n(TLS Termination)"]:::gateway
    
    NextJS["Next.js 14 Frontend\n(SSR/SSG/CSR)"]:::compute
    NestJS["NestJS 10 API\n(Stateless REST)"]:::compute
    Workers["BullMQ Workers\n(Background Jobs)"]:::compute
    
    Postgres[("PostgreSQL\n+ pgvector")]:::db
    Redis[("Redis\n(Cache & Queue)")]:::db
    S3[("S3 / DO Spaces\n(Object Storage)")]:::db
    
    AIProvider["AI Provider\n(OpenAI)"]:::ext
    
    %% Relationships
    User -->|HTTPS| DNS
    DNS -->|HTTPS| Nginx
    Nginx -->|/ (Static & SSR)| NextJS
    Nginx -->|/api (REST)| NestJS
    
    NextJS -->|API Calls| NestJS
    
    NestJS -->|SQL/Prisma| Postgres
    NestJS -->|Job Enqueue/Cache| Redis
    NestJS -->|Upload/Download| S3
    
    Workers -->|Dequeue Jobs| Redis
    Workers -->|SQL/Prisma| Postgres
    Workers -->|Process Data| S3
    Workers -->|API Calls| AIProvider
    NestJS -.->|Sync API Calls (Rare)| AIProvider
```

## Security Boundaries
- **Public Internet**: Cloudflare WAF and DNS filtering intercept basic DDoS and malicious payloads.
- **DMZ (Nginx)**: Only ports 80 and 443 are exposed. Nginx handles SSL termination and proxies internal traffic to port 3000 (Next.js) and 4000 (NestJS).
- **Internal Network**: Docker network isolates NestJS, Next.js, Redis, Postgres, and Workers. Databases and Workers have no inbound public ports exposed.
- **Data Layer**: PostgreSQL and Redis require strict internal authentication.

## Data Flow
1. User requests route through Cloudflare to Nginx.
2. Nginx routes frontend requests to Next.js and API requests to NestJS.
3. NestJS authenticates requests, processes business logic, and interacts with PostgreSQL via Prisma for transactional data.
4. Heavy tasks (e.g., document parsing, AI generation) are serialized and pushed to Redis queues.

## Queue Flow
1. NestJS acts as the BullMQ producer, adding jobs to Redis.
2. BullMQ Worker processes continuously poll Redis for jobs.
3. Workers execute tasks (e.g., calling OpenAI), update PostgreSQL upon completion, and optionally trigger WebSocket events or emails.

## AI Flow
1. System requires AI processing (e.g., grading an assessment).
2. Job is queued to avoid blocking the user request.
3. Worker picks up the job, retrieves necessary context from PostgreSQL (including vector searches if applicable).
4. Worker communicates with the AI Provider over encrypted HTTPS.
5. Worker saves AI results to PostgreSQL and marks the job as complete.

## Backup Flow
1. A cron job executes `pg_dump` daily.
2. The dump is compressed and encrypted.
3. The encrypted backup is pushed to DigitalOcean Spaces (S3-compatible).
4. Retention policies on Spaces automatically expire backups older than 30 days.

## Monitoring Flow
- Application logs (NextJS, NestJS, Workers) are output to stdout/stderr in JSON format.
- Docker captures logs.
- Vector metrics (CPU, Memory, Disk) and service metrics are scraped by Prometheus and visualized in Grafana (or DO native monitoring).
- Health checks are exposed at `/health` and monitored by external uptime services (e.g., UptimeRobot).
