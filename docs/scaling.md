# Scaling Strategy

This document defines the strategy for scaling the platform to meet capacity targets.

## Current Capacity Targets
- **Total Users**: 10,000+ students.
- **Concurrent Users**: 1,000 active sessions.
- **Data Volume**: High volume of vector embeddings and assessment logs.

## Horizontal API Scaling
The NestJS API is entirely **stateless** (sessions are JWT, caching is Redis).
- **Strategy**: Spin up multiple API Docker containers.
- **Implementation**: `docker compose up -d --scale api=3` or using a Swarm/K8s ReplicaSet.
- **Load Balancing**: Nginx handles round-robin distribution to API instances.

## Worker Scaling Strategy
Background workers process heavy AI tasks and handle queue backlogs.
- **Trigger**: Scale workers when Redis queue depth consistently exceeds 100 items or processing latency > 30 seconds.
- **Implementation**: Workers can be scaled independently on the same machine (`docker compose up --scale worker=5`) or distributed across multiple Droplets pointing to the same Redis instance.

## PostgreSQL Scaling
Databases are typically the first major bottleneck.
1. **Connection Pooling**: Implemented via Prisma. If connection limits are hit, deploy **PgBouncer** to multiplex connections.
2. **Vertical Scaling**: Upgrade Droplet/Managed DB RAM and CPU.
3. **Read Replicas**: For read-heavy analytical dashboards, spin up a DO Managed DB Read Node. Modify Prisma configuration to route read operations to the replica.
4. **Vector Tuning**: Optimize `pgvector` indexes (HNSW or IVFFlat) as the embedding dataset grows to maintain sub-100ms similarity search times.

## Redis Scaling
- Redis handles BullMQ, rate limiting, and caching.
- Usually, vertical scaling (more RAM) is sufficient.
- Set `maxmemory-policy` appropriately (e.g., `allkeys-lru` for cache, but ensure Queue data is persistent).

## Object Storage (S3) Scaling
- DigitalOcean Spaces / AWS S3 scales automatically and infinitely.
- Ensure CDN (Cloudflare or DO CDN) is placed in front of object storage to cache static assets geographically and reduce egress costs.

## When to Scale Component
| Component | Metric to Monitor | Threshold | Action |
|---|---|---|---|
| API | CPU/Memory / Response Time | CPU > 70% or p95 > 500ms | Add API container |
| Worker | Queue Depth / Job wait time | Depth > 100 or Wait > 30s | Add Worker container |
| Database | CPU / Connection count | CPU > 80% or Conn > 80% | Scale up RAM/CPU or add PgBouncer |
| Redis | Memory usage | Mem > 80% capacity | Scale up RAM |

## Database Archival Strategy
Over time, learning event logs will grow massively.
- **Retention Policy**: Keep granular analytical events in the hot PostgreSQL DB for 6-12 months.
- **Archival**: Create a cron job to move old events to cold storage (e.g., compressed CSVs in S3) or a cheaper analytical database (ClickHouse/Redshift) to keep primary DB performant.

## Future Considerations (Not Yet Needed)
- **Kubernetes (K8s)**: Overkill for current targets. Transition to K8s only when managing multi-node Docker deployments becomes operationally complex.
- **Kafka**: Current BullMQ/Redis setup can handle thousands of jobs/sec. Kafka is only necessary if complex event-streaming or multi-consumer pub/sub is required at massive scale.
