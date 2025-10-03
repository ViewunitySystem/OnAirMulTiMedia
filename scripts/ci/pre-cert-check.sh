#!/usr/bin/env bash
set -euo pipefail
python3 scripts/ci/validate_rf_chain.py modules/rf/loopback-node/blueprint.json modules/rf/loopback-node/schema/blueprint.schema.json
python3 scripts/ci/export_audit.py modules/rf/loopback-node/blueprint.json > modules/rf/loopback-node/data/audit-export.preview.json
