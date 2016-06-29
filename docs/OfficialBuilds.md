# Official builds

The official builds of this app are generated on [Travis](https://travis-ci.org/irccloud/irccloud-desktop) (macOS, Linux) and
[AppVeyor](https://ci.appveyor.com/project/russss/irccloud-desktop) (Windows)

## Code signing

macOS and Windows builds are code signed, and require some [electron-builder environment variables](https://github.com/electron-userland/electron-builder/wiki/Code-Signing)
to be set.

These are encrypted using CI server tools.

`CSC_LINK` is base64 encoded data of the .p12 file, e.g.

```
base64 -i cert.p12 -o cert.p12.b64
```

`CSC_KEY_PASSWORD` is the passphrase used to export the .p12 and can't be empty.

### macOS

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

On windows, the .p12 file is constructed manually from a Code Signing Identity and
chain like so:

```
openssl pkcs12 -export -in ourcert.pem -certfile chain.pem \
    -inkey ourkey.key -out codesign.p12
```

`chain.pem` is a concatenation of all the intermediaries in PEM format (make sure there
are no added new lines, some CAs are sloppy). The order should start with the issuer of
`ourcert.pem` and end with a CA cert issued by the [Microsoft Code Verification Root](http://www.microsoft.com/pki/certs/MicrosoftCodeVerifRoot.crt)
but that root itself isn't included in the chain.

Environment variables are encrypted via the [AppVeyor web interface](https://ci.appveyor.com/tools/encrypt)
and set in [appveyor.yml](../appveyor.yml)
