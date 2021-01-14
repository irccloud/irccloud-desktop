const path = require('path');
const tempFile = require("temp-file");
const isCi = require('is-ci');
const codeSign = require("app-builder-lib/out/codeSign/codeSign");
const _vm = require("app-builder-lib/out/vm/vm");
const log = require("builder-util/out/log").log;
const chalk = require("chalk");
const execFile = require('child_process').execFile;
const crypto = require('crypto');

const AZURE_KEY_VAULT_URL = process.env.AZURE_KEY_VAULT_URL;
const AZURE_KEY_CLIENT_ID  = process.env.AZURE_KEY_CLIENT_ID;
const AZURE_KEY_CLIENT_SECRET = process.env.AZURE_KEY_CLIENT_SECRET;
const AZURE_KEY_VAULT_CERTIFICATE  = process.env.AZURE_KEY_VAULT_CERTIFICATE;

const SECRETS = [
    AZURE_KEY_VAULT_URL,
    AZURE_KEY_CLIENT_ID,
    AZURE_KEY_CLIENT_SECRET,
    AZURE_KEY_VAULT_CERTIFICATE
];

exports.default = async function (configuration) {
    // log.info(configuration, 'sign config');

    // Don't sign on pull requests
    if (
        process.env.GITHUB_EVENT_NAME == 'pull_request' ||
        process.env.TRAVIS_EVENT_TYPE == 'pull_request' ||
        process.env.APPVEYOR_PULL_REQUEST_NUMBER > 0
    ) {
        return;
    }
    // Only process on one hash, we set hashes manually to control the order
    if (configuration.hash === 'sha1') {
        return;
    }
    const vm = new _vm.VmManager();
    const tempDirManager = new tempFile.TmpDir('packager');

    
    // signtool.exe
    // const windowsCodeSign = require("app-builder-lib/out/codeSign/windowsCodeSign");
    // const vendorPath = await windowsCodeSign.getSignVendorPath();
    // const signTool = path.join(vendorPath, "windows-10", process.arch, "signtool.exe");

    // https://github.com/vcsjones/AzureSignTool
    const signTool = "azuresigntool";
    
    // Appending each sig puts it after the top one, so the order here is a bit odd
    // For 4 signatures, sign in the following order: 1 4 3 2

    // 1
    let argsSha256 = computeAzureSignToolArgs(configuration, vm, false);
    log.info({hash: 'sha256', path: configuration.path, tool: signTool}, 'signing');
    await sign(signTool, argsSha256);

    tempDirManager.cleanup();
};

async function sign (signTool, args) {
    const timeout = 10 * 60 * 1000;
    await exec(signTool, args, {timeout})
}

async function getCert(tempDirManager, base64) {
    return await codeSign.downloadCertificate(base64, tempDirManager, process.cwd()).then(path => {
        return path;
    });
}

// Yoinked and adapted from:
// https://github.com/electron-userland/electron-builder/blob/d6c9d8fa704d0fe9bf3ed419c5dd4d59118695a8/packages/app-builder-lib/src/codeSign/windowsCodeSign.ts#L191
// certificateFile can be a base64 encoded p12 file
// password is the plain text key password
function computeSignToolArgs(options, vm, hash, append, certificateFile, password) {
    const inputFile = vm.toVmFile(options.path)
    const args = ["sign"];
    const d = '/';

    const timestampingServiceUrl = hash === "sha256" ? "http://timestamp.comodoca.com/rfc3161" :  "http://timestamp.verisign.com/scripts/timstamp.dll";
    const timestampArg = d + (hash === "sha256" ? "tr" : "t");
    args.push(timestampArg, timestampingServiceUrl);

    const certExtension = path.extname(certificateFile)
    if (certExtension === ".p12" || certExtension === ".pfx") {
        args.push(d+"f", vm.toVmFile(certificateFile))
    } else {
        throw new Error(`Please specify pkcs12 (.p12/.pfx) file, ${certificateFile} is not correct`)
    }
  
    args.push(d+"fd", hash)
    if (hash === "sha256") {
        args.push(d+"td", hash)
    }
  
    if (options.name) {
      args.push(d+"d", options.name)
    }
  
    if (options.site) {
      args.push(d+"du", options.site)
    }
  
    // msi does not support dual-signing
    if (append) {
      args.push(d+"as")
    }
  
    if (password) {
      args.push(d+"p", password)
    }
  
    if (options.options.additionalCertificateFile) {
      args.push(d+"ac", vm.toVmFile(options.options.additionalCertificateFile))
    }
    
    // https://github.com/electron-userland/electron-builder/issues/2875#issuecomment-387233610
    args.push(d+"debug")

    // must be last argument
    args.push(inputFile)
  
    return args
  }

  function computeAzureSignToolArgs(options, vm, append) {
    const inputFile = vm.toVmFile(options.path)
    const args = ["sign"];
    const d = '-';
    const hash = 'sha256';

    if (!AZURE_KEY_VAULT_URL || !AZURE_KEY_CLIENT_ID || !AZURE_KEY_CLIENT_SECRET || !AZURE_KEY_VAULT_CERTIFICATE) {
        throw new Error('Missing key vault params');
    }
    args.push('--azure-key-vault-url', AZURE_KEY_VAULT_URL);
    args.push('--azure-key-vault-client-id', AZURE_KEY_CLIENT_ID);
    args.push('--azure-key-vault-client-secret', AZURE_KEY_CLIENT_SECRET);
    args.push('--azure-key-vault-certificate', AZURE_KEY_VAULT_CERTIFICATE);
  
    const timestampingServiceUrl = "http://timestamp.comodoca.com/rfc3161";
    const timestampArg = d+"tr";
    args.push(timestampArg, timestampingServiceUrl);

    args.push(d+"fd", hash)
    args.push(d+"td", hash)
  
    if (options.name) {
      args.push(d+"d", options.name)
    }
  
    if (options.site) {
      args.push(d+"du", options.site)
    }
  
    // msi does not support dual-signing
    if (append) {
      args.push(d+"as")
    }
  
    if (options.options.additionalCertificateFile) {
      args.push(d+"ac", vm.toVmFile(options.options.additionalCertificateFile))
    }
    
    args.push(d+"v");

    // must be last argument
    args.push(inputFile)
  
    return args
  }

  function exec(file, args, options) {
    return new Promise((resolve, reject) => {
      execFile(file, args, {
      ...options,
      maxBuffer: 1000 * 1024 * 1024,
      env: process.env
    }, (error, stdout, stderr) => {
        if (error == null) {
          resolve(stdout.toString())
        }
        else {
          let message = chalk.red(removePassword(`Exit code: ${error.code}. ${error.message}`))
          if (stdout.length !== 0) {
            message += `\n${chalk.yellow(removePassword(stdout.toString()))}`
          }
          if (stderr.length !== 0) {
            message += `\n${chalk.red(removePassword(stderr.toString()))}`
          }
  
          reject(new Error(message))
        }
      })
    })
  }

  function removePassword(input) {
    return SECRETS.reduce((acc, secret) => {
        return acc.replace(new RegExp(escapeRegExp(secret), 'g'), () => {
            return '****';
            return `${crypto.createHash("sha256").update(secret).digest("hex")} (sha256 hash)`;
        });
    }, input);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }
  