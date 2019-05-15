# Official builds

The official builds of this app are generated on [Travis](https://travis-ci.org/irccloud/irccloud-desktop) (macOS, Linux) and
[AppVeyor](https://ci.appveyor.com/project/russss/irccloud-desktop) (Windows)

## Code signing

macOS and Windows builds are code signed, and require some [electron-builder environment variables](https://github.com/electron-userland/electron-builder/wiki/Code-Signing)
to be set.

These are encrypted using CI server tools.

### macOS

`CSC_LINK` is base64 encoded data of the .p12 file, e.g.

```
base64 -i cert.p12 -o cert.p12.b64
```

`CSC_KEY_PASSWORD` is the passphrase used to export the .p12 and can't be empty.

On macOS, the .p12 file is exported from Keychain Access. Make sure to expand the
Developer ID Application cert and select it along with its key before exporting.

Environment variables are encrypted by the [`travis`](https://github.com/travis-ci/travis.rb#readme)
command line tool, available as a gem.

Install: `gem install travis`

After installing the gem you need to authenticate to Travis with your GitHub
credentials using `travis login`. You can either enter your password or (e.g. if using 2FA)
use an [access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/).

GitHub credentials are only needed the first time you run login, at which point you'll get
a Travis access token in `~/.travis/config.yml` and you can revoke your GitHub access token after that. More details in the
[docs](https://github.com/travis-ci/travis.rb#login).

Once you've authenticated with Travis, copy <code>.travis.env<b>.example</b></code> to `.travis.env` and fill
in the appropriate variables. Then run `make encryptenv` to create the encrypted file
<code>.travis.env<b>.enc</b></code>. Make sure you don't commit the unencrypted .travis.env
(it's in [`.gitignore`](../.gitignore))

This file will be decrypted with a key hosted on Travis during a build and the environment
will be set automatically.

### Windows

For windows we use Azure Key Vault and define credentials with the following env vars:

```
AZURE_KEY_VAULT_URL
AZURE_KEY_CLIENT_ID
AZURE_KEY_CLIENT_SECRET
AZURE_KEY_VAULT_CERTIFICATE
```

IMPORTANT: For local dev, put these in an env file in codesign and source it to avoid ever commiting secrets, e.g.
```
# codesign/codesign.env contents
export AZURE_KEY_VAULT_URL="blah..."
...

# source it when running local signed builds
. codesign/codesign.env
```

The signing procedure is scripted in scripts/sign.js

Our setup for key vault is as described here https://natemcmaster.com/blog/2018/07/02/code-signing/

The AzureSignTool can be installed with the following command after installing .NET Core SDK https://dotnet.microsoft.com/download

```
dotnet tool install --global AzureSignTool --version 2.0.17
```

Environment variables are encrypted via the [AppVeyor web interface](https://ci.appveyor.com/tools/encrypt)
and set in [appveyor.yml](../appveyor.yml)
