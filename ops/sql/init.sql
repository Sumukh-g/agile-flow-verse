-- One-time Postgres init for docker-compose
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS vector;
-- pg_cron is not preinstalled in official postgres image. If needed, switch image or build custom. 