.PHONY: build up down logs run dev clean shell

DOCKER_COMPOSE = docker-compose

# Build Docker image
build:
	$(DOCKER_COMPOSE) build

# Run in background
up:
	$(DOCKER_COMPOSE) up 

# Stop and remove containers
down:
	$(DOCKER_COMPOSE) down

# Follow logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Build and run in foreground (good for Railway-like local run)
run: build
	$(DOCKER_COMPOSE) up

# Run locally without Docker (frontend + API)
dev:
	@echo "Run in two terminals:"
	@echo "  1) make dev-server  (API on :3001)"
	@echo "  2) make dev-client  (Vite on :5173)"
	@echo "Or: make dev-server & make dev-client"

dev-server:
	cd server && npm run dev

dev-client:
	npm run dev

# Remove containers and built image
clean: down
	$(DOCKER_COMPOSE) build --no-cache 2>/dev/null || true
	docker rmi blind_project-app 2>/dev/null || true

# Shell into running app container
shell:
	$(DOCKER_COMPOSE) exec app sh
