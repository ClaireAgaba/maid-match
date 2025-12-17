#!/bin/bash
set -e

cd web
npm ci
npm run build

cd ../mobile
npm ci
npx cap sync ios
