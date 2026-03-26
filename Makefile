.PHONY: dev build db-up db-down seed clean lint format

dev:            ## Start all services in dev mode
	docker compose up -d mongo redis mongo-init
	pnpm turbo dev

build:          ## Build all packages
	pnpm turbo build

db-up:          ## Start MongoDB + Redis
	docker compose up -d

db-down:        ## Stop MongoDB + Redis
	docker compose down

seed:           ## Seed the database
	pnpm --filter @dsa-tracker/api seed

clean:          ## Remove all build artifacts
	pnpm turbo clean
	rm -rf node_modules apps/*/node_modules

lint:           ## Lint all packages
	pnpm turbo lint

format:         ## Format all files
	pnpm prettier --write .
