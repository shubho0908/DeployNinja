#!/bin/bash

export GITHUB_REPO_URL="$GIT_REPO_URL"

git clone "$GITHUB_REPO_URL" /home/app/output

cd /home/app/output || exit

exec npx ts-node script.ts
