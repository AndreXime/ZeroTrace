.PHONY: build dev

dev:
	cd frontend && npm run dev & \
	DEV_PID=$$! && \
	trap "kill $$DEV_PID" EXIT && \
	air

build:
	cd frontend && npm run build -s
	go build .