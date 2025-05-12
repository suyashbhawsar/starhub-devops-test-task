# NestJS To-Do CRUD API

This is a simple NestJS REST API for a to-do list, with MongoDB persistence and structured JSON logging.

## Prerequisites
- Bun (https://bun.sh) for package management and runtime
- MongoDB (local or remote instance)

## Setup & Run
1. Ensure MongoDB is running on `mongodb://localhost:27017`. For example:
   - Using Docker: `docker run -d --name mongodb -p 27017:27017 mongo:latest`
   - Or locally: start the `mongod` service.
2. Install dependencies:
   - bun install

3. Start the server in development mode (live reload):
   bun run start:dev

4. Build for production and start:
   bun run build
   bun run start:prod

5. The API listens on port 3000 by default; override with the PORT environment variable:
   PORT=4000 bun run start:prod

## API Endpoints
- `POST /todos` – Create a new to-do item.
- `GET /todos` – Retrieve all to-do items.
- `GET /todos/:id` – Retrieve a specific to-do item by ID.
- `PATCH /todos/:id` – Update fields of a to-do item.
- `DELETE /todos/:id` – Delete a to-do item.

## Logging
Each CRUD operation emits a structured JSON log to stdout, e.g.:
```json
{ "action": "create", "todo": { "_id": "...", "title": "Example", ... } }
```

## Docker Compose

Bring up the full stack (API, MongoDB, Elasticsearch, Filebeat, Kibana) with a single command:
```bash
docker compose up --build
```
This will:
- Build and start the NestJS API on http://localhost:3000
- Launch MongoDB on port 27017
- Launch Elasticsearch on port 9200
- Launch Kibana on port 5601
- Run Filebeat to ingest JSON logs from Docker containers into Elasticsearch

Once running, access:
- API: http://localhost:3000/todos
- Kibana UI: http://localhost:5601
  • Create an index pattern `todo-app-*` (use `@timestamp` as the time field) to view logs.

## Dockerized Services
- api (NestJS): containerized for consistent Node runtime and dependency isolation.
- mongo (MongoDB): containerized to package the database, simplify setup and ensure version consistency.
- elasticsearch: containerized to bundle ES with matching dependencies and allow easy scaling/teardown.
- kibana: containerized to align with Elasticsearch version, no local install required.
- filebeat: containerized to run alongside Docker host, collect and forward container logs.

## ELK Integration
### Log Forwarding Pipeline
1. NestJS API logs structured JSON to stdout.
2. Filebeat (hosted in its own container) tails Docker container logs under `/var/lib/docker/containers`, decodes JSON, and enriches with Docker metadata.
3. Filebeat ships logs into Elasticsearch via the configured output.

### Index Pattern Naming
Filebeat writes into daily indices named `todo-app-YYYY.MM.DD`, with the index pattern `todo-app-*`.

### Kibana Dashboard Setup
1. Open Kibana at http://localhost:5601
2. Go to **Stack Management > Index Patterns**, click **Create index pattern**, enter `todo-app-*`, select `@timestamp`, and save.
3. In **Discover**, select the `todo-app-*` pattern and confirm you see your logs.
4. In **Visualize**, create a new **Line** (or **Area**) chart:
   - Y-axis: **Count**
   - X-axis: **Date Histogram** on `@timestamp`
   - Save the visualization as **Log Count Over Time**.
5. In **Dashboard**, click **Create dashboard**, add **Log Count Over Time**, and save as **Todo App Logs**.
6. (Optional) Export your dashboard and visualization via **Management > Saved Objects > Export**, save `kibana/todo-app-logs.ndjson`, and commit to the repo.

## Accessing Services
- API: http://localhost:3000/todos
- Kibana: http://localhost:5601

## Observability & Logging

### 1. Filebeat Configuration
Filebeat is configured in `filebeat/filebeat.yml` to ingest Docker logs from all services and ship parsed JSON to Elasticsearch.
```yaml
filebeat.inputs:
  - type: docker
    containers.ids: ['*']         # Tail logs from every container

processors:
  - add_docker_metadata: {}       # Attach container metadata (name, id, image, labels)
  - decode_json_fields:          # Decode JSON in the `message` field into root-level fields
      fields: ['message']
      target: ''
      overwrite_keys: true

setup.kibana:
  host: 'kibana:5601'             # Filebeat dashboard loader

setup.template.name: 'todo-app'
setup.template.pattern: 'todo-app-*'

output.elasticsearch:
  hosts: ['elasticsearch:9200']   # Elasticsearch endpoint
  index: 'todo-app-%{+yyyy.MM.dd}' # Daily index per date

setup.ilm.enabled: false         # Disable ILM for simplicity
```

### 2. Log Format & Fields
- **Application logs**: Each NestJS service/controller logs with `Logger.log(JSON.stringify(...))`. Logs include:
  - `action`: operation name (`create`, `findAll`, `controller_update`, etc.)
  - `todo`, `count`, `id`: payload or context
- **Elasticsearch documents** include parsed JSON plus metadata:
  - `@timestamp`: ingestion time
  - Docker metadata: `container.name`, `container.id`, `container.image.name`, container labels
  - `host.name`, `ecs.version`, `log.file.path`, `log.offset`

### 3. Index Pattern
1. In Kibana, navigate to **Stack Management > Index Patterns**
2. Click **Create index pattern**, enter `todo-app-*`, **Next step**
3. Choose `@timestamp` as the time field, click **Create index pattern**

### 4. Discover & Filter Logs
- Use the **Discover** tab with KQL queries:
  ```text
  container.name:"todo-api"        # Show only API logs
  action:"create"                  # Show create operations
  res.statusCode >= 400             # Show error responses
  ```

### 5. Visualizations & Dashboard
1. **Visualize**:
   - *CRUD Operations Over Time* (Line chart):
     - Y-axis: Count  
     - X-axis: Date Histogram on `@timestamp`  
     - Split series by `action.keyword`
   - *Operations Breakdown* (Pie chart): Count by `action.keyword`
   - *Error Logs* (Data table): filter `res.statusCode >= 400`, columns: `@timestamp`, `action`, `message`, `res.statusCode`, `container.name`
2. **Dashboard**:
   - Create new, add the above visualizations, save as *Todo App Logs*

### 6. Export/Import Dashboards
- **Export**: In **Management > Saved Objects**, select your index pattern, visualizations, dashboard, and export to `kibana/todo-app-logs.ndjson`.
- **Import**: Use **Saved Objects > Import** to load the NDJSON file for peers or CI.

## Example Workflows
- **Search recent API logs**:
  ```bash
  curl 'http://localhost:9200/todo-app-*/_search?size=5&pretty'
  ```
- **Create a todo and view logs**:
  ```bash
  curl -X POST http://localhost:3000/todos \
    -H 'Content-Type: application/json' \
    -d '{"title":"Test","completed":false}'
  ```

## Environment Variables
- `PORT`: HTTP port for the API (default `3000`)
- `MONGO_URI`: MongoDB connection (Docker Compose defaults to `mongodb://mongo:27017/todo-app`)

## Makefile Commands
To simplify common workflows, a `Makefile` is provided:
```bash
make install        # Install dependencies via Bun
make build          # Compile TypeScript via Bun
make docker-build   # Build the Docker image for the API
make up             # Start full stack (API, MongoDB, Elasticsearch, Filebeat, Kibana)
make down           # Stop and remove containers
make logs           # Tail logs for all services
make dashboards     # Load Filebeat sample dashboards into Kibana
```

## Project Structure

Project files and directories:
- **bun.lock**: Bun dependency lockfile.
- **package.json**: Scripts and dependencies (used by Bun).
- **tsconfig.json**: TypeScript compiler settings.
- **src/**: Application source code.
- **dist/**: Compiled JavaScript output (ignored in Git).
- **filebeat/**: Filebeat config to collect and forward Docker container logs.
- **kibana/**: Kibana saved objects export (`todo-app-logs.ndjson`).
- **Dockerfile**: Builds the API image with Bun and TypeScript.
- **docker-compose.yml**: Orchestrates API, MongoDB, Elasticsearch, Kibana, Filebeat.
- **Makefile**: Convenience commands for setup, build, run, and dashboards.
- **.gitignore**: Excludes artifacts, logs, and sensitive files.

## Data Persistence

MongoDB and Elasticsearch data are stored in Docker volumes:
- `mongo-data` → `/data/db`
- `es-data`  → `/usr/share/elasticsearch/data`

To inspect or back up data:
```bash
docker volume inspect mongo-data
docker run --rm -v mongo-data:/data alpine ls /data/db
```

To purge all persisted data (irreversible):
```bash
docker compose down
docker volume rm mongo-data es-data
```

## Troubleshooting

**API connection errors**
- Verify MongoDB is running: `docker logs todo-mongo`
- Check `MONGO_URI` (default: `mongodb://mongo:27017/todo-app`).

**Filebeat issues**
- View logs: `docker logs todo-filebeat`
- Test ES connection:
  ```bash
  docker compose run --rm filebeat test output
  ```

**Elasticsearch / Kibana issues**
- ES health: `curl -s http://localhost:9200/_cluster/health?pretty`
- ES logs: `docker logs todo-elasticsearch`
- Kibana logs: `docker logs todo-kibana`
- Verify index template: `curl -s http://localhost:9200/_template/todo-app?pretty`

## Production Considerations

- **Security**: Enable TLS/basic auth via X-Pack or reverse proxy for Elasticsearch & Kibana.
- **Secrets**: Use Docker secrets or environment files for sensitive config (excluded via `.gitignore`).
- **Resource limits**: Configure CPU/memory constraints on containers.
- **Log rotation & ILM**: Consider enabling ILM policies for index rollover and retention.
- **High availability**: Deploy a multi-node ES cluster and load-balanced API instances.

## Advanced Querying Examples

- Count completed to-dos:
  ```json
  POST /todo-app-*/_search
  {
    "size": 0,
    "aggs": {
      "completed_count": {
        "filter": { "term": { "todo.completed": true } }
      }
    }
  }
  ```
- CRUD operations per hour:
  ```json
  POST /todo-app-*/_search
  {
    "size": 0,
    "aggs": {
      "per_hour": {
        "date_histogram": { "field": "@timestamp", "fixed_interval": "1h" },
        "aggs": { "by_action": { "terms": { "field": "action.keyword" } } }
      }
    }
  }
  ```

## Extending and Scaling

- **Multiple API instances**: Scale the `api` service in Docker Swarm or Kubernetes.
- **Custom Filebeat processors**: Filter, enrich, or drop events via the `processors` section in `filebeat/filebeat.yml`.
- **Correlation IDs**: Add a NestJS interceptor to tag logs with a `requestId` for end-to-end tracing.
- **Monitoring**: Use Kibana’s Monitoring UI (requires X-Pack) to observe ES, Kibana, and Filebeat metrics.