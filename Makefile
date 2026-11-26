.PHONY: doctor check lint test build audit all

doctor:
	python3 scripts/doctor.py
	node scripts/validate-catalog.mjs

check:
	corepack pnpm run check

lint:
	corepack pnpm run lint

test:
	corepack pnpm test

build:
	corepack pnpm run build

audit:
	corepack pnpm run audit

all: doctor check lint test build audit
