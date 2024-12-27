#!/bin/bash

export GITHUB_REPO_URL="$GITHUB_REPO_URL"

git clone "$GITHUB_REPO_URL" /home/app/output

exec node server.js
