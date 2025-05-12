SHELL := /bin/bash

.PHONY: help install build docker-build up down logs dashboards

help:
	@echo "Makefile commands:"
	@echo "  make install       Install project dependencies via bun"
	@echo "  make build         Compile TypeScript to JavaScript via bun"
	@echo "  make docker-build  Build the Docker image for the API"
	@echo "  make up            Start all services via Docker Compose"
	@echo "  make down          Stop and remove Docker Compose services"
	@echo "  make logs          Tail logs for all services"
	@echo "  make dashboards    Load Filebeat sample dashboards into Kibana"

install:
	@echo "Installing dependencies via bun..."
	bun install

build:
	@echo "Building project via bun..."
	bun run build

docker-build:
	@echo "Building Docker image 'todo-app:latest'..."
	docker build -t todo-app:latest .

up:
	@echo "Starting services..."
	docker compose up --build

down:
	@echo "Stopping services..."
	docker compose down

logs:
	@echo "Tailing logs for all services..."
	docker compose logs -f
 
dashboards:
	@echo "Loading Filebeat dashboards into Kibana..."
	docker compose run --rm filebeat setup --dashboards
