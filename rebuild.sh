#!/usr/bin/env bash
set -euo pipefail
cd /home/team/shared/site
rm -rf dist
bun run build 2>&1
echo "BUILD_DONE=$?"
