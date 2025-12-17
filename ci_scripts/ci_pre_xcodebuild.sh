#!/bin/bash
set -e

cd mobile
npx cap sync ios

cd ios/App
pod install
