#!/bin/bash
set -ev
yarn run test
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
  yarn run snyk
  yarn run mac
fi
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  yarn run linux
fi