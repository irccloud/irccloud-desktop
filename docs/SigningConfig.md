Signing on macOS is a bit in flux atm. 

https://github.com/electron-userland/electron-builder/issues/3870
https://github.com/electron-userland/electron-builder/issues/3940
https://github.com/electron-userland/electron-builder/issues/3828
https://github.com/electron-userland/electron-builder/issues/3908
https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

Config settings related to this are in electron-builder.json

{
    "mac": {
        "hardenedRuntime" : true,
        "gatekeeperAssess": false,
        "entitlements": {
          "entitlements": "build/entitlements.mac.plist",
          "entitlementsInherit": "build/entitlements.mac.plist"
        }
    },
    "dmg": {
        "sign": false
    }
}

Ideally these settings and the build/entitlements.mac.plist will no longer be needed once this is all sorted out.

Notarizing isn't confirmed working yet, might need to be done manually initially, but warnings about unsigned executables should be gone.
