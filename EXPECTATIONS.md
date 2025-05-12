TEST TASK – DevOps + NestJS

1. Mandatory Tech Stack
   DevOps  : Docker, Kubernetes, Helm, ELK Stack
   Backend : NestJS, MongoDB, RabbitMQ, Redis, Apollo GraphQL
   Frontend: React / Next.js / SCSS / Apollo GraphQL (nice-to-have, not required)

2. What to Build
   • Simple “to-do list” API (CRUD) using NestJS + MongoDB.
   • Log every CRUD action in structured JSON.
   • Containerize all components; run locally with Docker Compose.
   • Feed logs to Elasticsearch via Logstash (or Filebeat).
   • Create a Kibana dashboard showing:
        – Count of each CRUD operation over time
        – Any error logs

3. Required Deliverables
   a. Public GitHub repo with full source.
   b. docker-compose.yml that spins up:
        – NestJS service
        – MongoDB
        – Elasticsearch
        – Logstash (or Filebeat)
        – Kibana
   c. README containing:
        – Exact build / run commands
        – Rationale for Dockerizing each service
        – Steps + URL to access Kibana (include index pattern if needed)
        – Screenshots OR description of the Kibana dashboard
   d. Dashboard exported/saved so it loads automatically.
   e. One-command startup: `docker compose up` should bring everything online.

4. Logging Details
   • Emit JSON logs to stdout/file (Winston, Pino, or Nest Logger).
   • Logstash/Filebeat picks up only those logs → Elasticsearch.
   • Use index naming like `todo-app-YYYY.MM.DD`.

5. Deployment Scope
   • Local-only; no cloud/K8s cluster required for test task.
   • Code should still be production-friendly (env vars, small Docker images, etc.).
