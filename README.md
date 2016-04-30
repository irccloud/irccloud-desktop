# IRCCloud Desktop

This is a prototype of an IRCCloud desktop app for Windows, Linux
(Debian/Ubuntu), and MacOS X. The app wraps the IRCCloud website
in a native window.

This app is currently experimental and is not officially supported,
however it should provide equivalent or better functionality to other
IRCCloud desktop wrapper apps.

If you have any issues, please file them in the [GitHub Issue
Tracker](https://github.com/irccloud/irccloud-desktop/issues).

## Downloading

IRCCloud Desktop can be [downloaded here](http://desktop.irccloud.com).
The appropriate version should be detected based on your OS.

## Development
[![Build
Status](https://travis-ci.org/irccloud/irccloud-desktop.svg?branch=master)](https://travis-ci.org/irccloud/irccloud-desktop)
[![Build status](https://ci.appveyor.com/api/projects/status/gx0f02q8w4hqwdt0?svg=true)](https://ci.appveyor.com/project/russss/irccloud-desktop)

IRCCloud Desktop is built on the Electron app framework, as used by
GitHub's Atom editor. For more information, check out the [Electron
documentation](http://electron.atom.io/docs/v0.37.8/).

### Build Requirements
* Node JS version 5.3 or higher

### Running

Run `npm install` in the root of the repository. `make dev` will run the
app quickly (without icons).

To build a full version, `make dist`.

## Feedback

If you have any questions, get in touch on [#feedback at
irc.irccloud.com](https://www.irccloud.com/#!/ircs://irc.irccloud.com:6697/%23feedback).


