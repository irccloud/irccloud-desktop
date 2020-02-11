#!/bin/bash
set -ev
yarn run test
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
  yarn run snyk
  travis_wait 20 yarn run mac
fi
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  yarn run linux
fi