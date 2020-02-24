#!/bin/bash
set -ev
yarn run test
if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then
  yarn run snyk
  yarn run mac
fi
if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then
  sudo snap install snapcraft --classic
  sudo snap install multipass --beta --classic
  sudo snap install review-tools
  yarn run linux
fi