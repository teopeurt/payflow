# Change these variables as necessary.
MAIN_PACKAGE_PATH := ./main.go
SCHEDULER_PACKAGE_PATH := ./cmd/scheduler/main.go
CRON_PACKAGE_PATH := ./cmd/cron/main.go
BINARY_NAME := payflower
SCHEDULER_BINARY := scheduler
CRON_BINARY := cron

# ==================================================================================== #
# HELPERS
# ==================================================================================== #

## help: print this help message
.PHONY: help
help:
	@echo 'Usage:'
	@sed -n 's/^##//p' ${MAKEFILE_LIST} | column -t -s ':' |  sed -e 's/^/ /'

.PHONY: confirm
confirm:
	@echo -n 'Are you sure? [y/N] ' && read ans && [ $${ans:-N} = y ]

.PHONY: no-dirty
no-dirty:
	git diff --exit-code


# ==================================================================================== #
# QUALITY CONTROL
# ==================================================================================== #

## tidy: format code and tidy modfile
.PHONY: tidy
tidy:
	go fmt ./...
	go mod tidy -v

## audit: run quality control checks
.PHONY: audit
audit:
	go mod verify
	go vet ./...
	go run honnef.co/go/tools/cmd/staticcheck@latest -checks=all,-ST1000,-U1000 ./...
	go run golang.org/x/vuln/cmd/govulncheck@latest ./...
	go test -race -buildvcs -vet=off ./...


# ==================================================================================== #
# DEVELOPMENT
# ==================================================================================== #

## test: run all tests
.PHONY: test
test:
	go test -v -race -buildvcs ./...

## test/cover: run all tests and display coverage
.PHONY: test/cover
test/cover:
	go test -v -race -buildvcs -coverprofile=/tmp/coverage.out ./...
	go tool cover -html=/tmp/coverage.out

## generate: generate ent code
.PHONY: generate
generate:
	go generate ./ent

## build: build the application
.PHONY: build
build: generate
	# Include additional build steps, like TypeScript, SCSS or Tailwind compilation here...
	go build -o=/tmp/bin/${BINARY_NAME} ${MAIN_PACKAGE_PATH}

## build/scheduler: build the scheduler application
.PHONY: build/scheduler
build/scheduler: generate
	go build -o=/tmp/bin/${SCHEDULER_BINARY} ${SCHEDULER_PACKAGE_PATH}

## build/cron: build the cron application
.PHONY: build/cron
build/cron: generate
	go build -o=/tmp/bin/${CRON_BINARY} ${CRON_PACKAGE_PATH}

## build/all: build all applications
.PHONY: build/all
build/all: build build/scheduler build/cron

## run: run the main API application
.PHONY: run
run: build
	/tmp/bin/${BINARY_NAME}

## run/scheduler: run the scheduler once
.PHONY: run/scheduler
run/scheduler: build/scheduler
	/tmp/bin/${SCHEDULER_BINARY}

## run/cron: run the continuous cron scheduler
.PHONY: run/cron
run/cron: build/cron
	/tmp/bin/${CRON_BINARY}

## run/live: run the application with reloading on file changes
.PHONY: run/live
run/live:
	go run github.com/cosmtrek/air@latest \
		--build.cmd "make build" --build.bin "/tmp/bin/${BINARY_NAME}" --build.delay "100" \
		--build.exclude_dir "" \
		--build.include_ext "go, tpl, tmpl, html, css, scss, js, ts, sql, jpeg, jpg, gif, png, bmp, svg, webp, ico" \
		--misc.clean_on_exit "true"


# ==================================================================================== #
# OPERATIONS
# ==================================================================================== #

## push: push changes to the remote Git repository
.PHONY: push
push: tidy audit no-dirty
	git push

