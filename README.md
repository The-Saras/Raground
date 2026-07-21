# RagGround

RagGround is a backend platform that simplifies building Retrieval-Augmented Generation (RAG) applications. Instead of implementing document ingestion, chunking, embeddings, vector storage, and retrieval from scratch, developers can create workspaces, upload data sources, and interact with them through simple APIs.

The goal of RagGround is to provide an opinionated RAG backend that allows developers to focus on building AI applications rather than managing the entire retrieval pipeline.

---

## Features

- Workspace management
- Data source management
- Asynchronous ingestion jobs
- Automatic document chunking
- Vector embeddings generation
- Semantic search using pgvector
- REST API
- Queue-based processing using Redis
- Modular service architecture

---

## Tech Stack

| Layer | Technology |
|--------|------------|
| Language | TypeScript |
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Vector Store | pgvector |
| ORM | Prisma |
| Queue | Redis + BullMQ |
| AI | Azure OpenAI |
| Package Manager | npm |

---

## Project Structure

```
ragground/
│
├── apps/
│   └── api/
│
├── packages/
│   ├── database/
│   ├── shared/
│   └── generated/
│
├── docker-compose.yml
└── README.md
```

---

## Architecture

```
                Client
                   │
                   ▼
            Express REST API
                   │
        ┌──────────┴──────────┐
        │                     │
 Workspace Service     Datasource Service
        │                     │
        └──────────┬──────────┘
                   │
                PostgreSQL
                   │
             Prisma ORM
                   │
        ┌──────────┴──────────┐
        │                     │
      BullMQ Queue         Redis
                   │
                   ▼
            Background Worker
                   │
      Chunk → Embed → Store Vector
```

---

## Installation

Clone the repository.

```bash
git clone https://github.com/yourusername/ragground.git

cd ragground
```

Install dependencies.

```bash
npm install
```

Start PostgreSQL and Redis.

```bash
docker compose up -d
```

Run database migrations.

```bash
npx prisma migrate dev
```

Generate Prisma client.

```bash
npx prisma generate
```

Start the development server.

```bash
npm run dev
```

---

## Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

REDIS_HOST=
REDIS_PORT=

AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=
AZURE_OPENAI_DEPLOYMENT=
```

---

## API Overview

### Create Workspace

```http
POST /api/workspaces
```

Request

```json
{
  "name": "Legal Documents",
  "userId": "user-id"
}
```

---

### Create Data Source

```http
POST /api/datasources
```

Request

```json
{
  "workspaceId": "workspace-id",
  "type": "TEXT",
  "content": "Your document content..."
}
```

---

### Search

```http
POST /api/search
```

Request

```json
{
  "workspaceId": "workspace-id",
  "query": "What is the refund policy?"
}
```

---

## Processing Flow

1. User creates a workspace.
2. User uploads a data source.
3. A background job is added to Redis.
4. Worker processes the job.
5. Document is chunked.
6. Embeddings are generated.
7. Vectors are stored in PostgreSQL using pgvector.
8. Search API retrieves the most relevant chunks.
9. Retrieved context is passed to the LLM for response generation.

---

## Future Improvements

- PDF ingestion
- Website crawling
- File uploads
- Multiple embedding providers
- Multiple LLM providers
- Hybrid search
- Metadata filtering
- Authentication
- Streaming responses
- Workspace analytics

---

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request.

---

## License

This project is licensed under the MIT License.
