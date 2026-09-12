-- Initialize pgvector extension for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log completion
RAISE NOTICE 'pgvector and uuid-ossp extensions initialized successfully.';
