.PHONY: build up down logs run dev clean shell stop-api

DOCKER_COMPOSE = docker-compose

# Build Docker image
build:
	$(DOCKER_COMPOSE) build

# Run in background
up:
	$(DOCKER_COMPOSE) up -d

# Stop and remove containers
down:
	$(DOCKER_COMPOSE) down

# Follow logs
logs:
	$(DOCKER_COMPOSE) logs -f

# Build and run in foreground (good for Railway-like local run)
run: build
	$(DOCKER_COMPOSE) up

# Run full stack locally (API :3001 + Vite :5173) in one terminal
dev:
	npm run dev:all

# Free port 3001 (run this if you get EADDRINUSE, then run make dev again)
stop-api:
	@-fuser -k 3001/tcp 2>/dev/null; \
	(PID=$$(lsof -t -i :3001 2>/dev/null); [ -n "$$PID" ] && kill $$PID) 2>/dev/null; \
	echo "Port 3001 freed (or was already free)."

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
