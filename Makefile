.PHONY: dev build start test lint db-push db-studio docker-up docker-dev docker-down docker-build

# Development
dev:
	npm run dev

build:
	npm run build

start:
	npm start

# Testing
test:
	npm run test

test-watch:
	npm run test:watch

lint:
	npm run lint

# Database
db-push:
	npx drizzle-kit push

db-studio:
	npx drizzle-kit studio

db-generate:
	npx drizzle-kit generate

# Docker
docker-up:
	docker compose up -d

docker-dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

docker-down:
	docker compose down

docker-build:
	docker compose build app

docker-logs:
	docker compose logs -f app

# Knowledge Base
ingest:
	npm run ingest

# Install
install:
	npm install

# Clean
clean:
	rm -rf node_modules .next dist
