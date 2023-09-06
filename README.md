# IRCCloud Desktop

⚠️ **This app is now discontinued and will no longer be updated.** Instead, we recommend you install the IRCCloud website as an app using your browser.

## Development

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
