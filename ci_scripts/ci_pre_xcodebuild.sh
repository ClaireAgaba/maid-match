#!/bin/bash
set -e

cd mobile
npx cap sync ios

cd ios/App
if ! command -v pod >/dev/null 2>&1; then
  gem install --user-install cocoapods -N
  export PATH="$HOME/.gem/ruby/$(ruby -e 'require "rbconfig"; print RbConfig::CONFIG["ruby_version"]')/bin:$PATH"
fi

pod --version
pod install
