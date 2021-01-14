# IRCCloud Desktop

This is a prototype of an IRCCloud desktop app for Windows, Linux, and macOS. The app wraps the IRCCloud website in a native window.

This app is currently experimental and is not officially supported, however it should provide equivalent or better functionality to other IRCCloud desktop wrapper apps.

If you have any issues, please file them in the [GitHub Issue Tracker](https://github.com/irccloud/irccloud-desktop/issues).

## Downloading

The latest official build can be [downloaded here](https://desktop.irccloud.com). The appropriate version should be detected based on your OS.

* Mac: DMG
* Windows: Installer
* Linux: AppImage

On Linux, the app is also available on [Snapcraft](https://snapcraft.io/irccloud)

You can also browse the [Releases](https://github.com/irccloud/irccloud-desktop/releases) list for other artifacts, e.g. (Mac ZIP, deb, source tarball)

## Development
[![Build status](https://github.com/irccloud/irccloud-desktop/workflows/Build/badge.svg)](https://github.com/irccloud/irccloud-desktop/actions?query=workflow%3ABuild)
[![IRC #feedback](https://img.shields.io/badge/IRC-%23feedback-1e72ff.svg?style=flat)](https://www.irccloud.com/invite?channel=%23feedback&amp;hostname=irc.irccloud.com&amp;port=6697&amp;ssl=1)

IRCCloud Desktop is built on the Electron app framework, as used by
GitHub's Atom editor. For more information, check out the [Electron
documentation](https://electronjs.org/docs). Build and packaging is handled by the excellent [electron-builder](https://www.electron.build/) project.

### Build Requirements

* Node JS version >= 12.13.1
* yarn (recommended) or NPM (should also work fine)

On Linux, you also need the `libopenjp2-tools` package.

### Running

Run `make dev` in the root of the repository to run the app quickly (without icons).

To build a full version, `make dist`.

Instructions for building packages and signed binaries on CI are at [docs/OfficialBuilds.md](docs/OfficialBuilds.md)

## Feedback

If you have any questions, get in touch on [#feedback at irc.irccloud.com](https://www.irccloud.com/invite?channel=%23feedback&amp;hostname=irc.irccloud.com&amp;port=6697&amp;ssl=1).
