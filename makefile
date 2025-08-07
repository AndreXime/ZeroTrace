.PHONY: build dev

dev:
	air

build:
	cd frontend && npm run build -s
	go build -o bin/GhostChat
