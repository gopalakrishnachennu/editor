.PHONY: dev build shell down clean help

# Colors
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

## Help: Show this help message
help:
	@echo ''
	@echo 'Usage:'
	@echo '  ${YELLOW}make${RESET} ${GREEN}<target>${RESET}'
	@echo ''
	@echo 'Targets:'
	@awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")-1); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "  ${YELLOW}%-15s${RESET} %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)

## Dev: Start the development server (detached)
dev:
	docker compose up -d
	@echo "${GREEN}Server started! Logs available via 'docker compose logs -f'${RESET}"

## Logs: Follow the logs
logs:
	docker compose logs -f

## Build: Rebuild the container (use after package.json changes)
build:
	docker compose up -d --build

## Shell: Open a shell inside the running container
shell:
	docker compose exec app sh

## Down: Stop containers
down:
	docker compose down

## Clean: Stop containers and remove volumes (Full Reset)
clean:
	docker compose down -v
	@echo "${YELLOW}Environment cleaned.${RESET}"
