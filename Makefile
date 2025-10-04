.PHONY: setup test build web serve lint clean

setup:
	npm i || pnpm i
	cd core && cargo fetch

test:
	npm run test:unit
	cd core && cargo test --all --all-features

build:
	cd webui && (pnpm build || npm run build)
	cd core && cargo build --release

web:
	cd webui && (pnpm dev || npm run dev)

lint:
	npm run lint || true
	cd core && cargo clippy -- -D warnings

clean:
	rm -rf webui/dist coverage .nyc_output
	cd core && cargo clean
