#!/bin/bash
set -e

cd web
npm ci
npm run build

cd ../mobile
npm ci
npx cap sync ios

cd ios/App
pwd
ls -la

if ! command -v pod >/dev/null 2>&1; then
  gem install --user-install cocoapods -N
  export PATH="$HOME/.gem/ruby/$(ruby -e 'require "rbconfig"; print RbConfig::CONFIG["ruby_version"]')/bin:$PATH"
fi

pod --version
pod install
