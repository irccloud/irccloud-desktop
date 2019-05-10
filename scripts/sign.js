const path = require('path');
const tempFile = require("temp-file");
const codeSign = require("app-builder-lib/out/codeSign/codeSign");
const windowsCodeSign = require("app-builder-lib/out/codeSign/windowsCodeSign");
const _vm = require("app-builder-lib/out/vm/vm");

const OLD_CERTIFICATE_B64 = process.env.WINDOWS_SIGN_CERTIFICATE_B64_OLD;
const OLD_TOKEN_PASSWORD  = process.env.WINDOWS_SIGN_TOKEN_PASSWORD_OLD;
const NEW_CERTIFICATE_B64 = process.env.WINDOWS_SIGN_CERTIFICATE_B64_NEW;
const NEW_TOKEN_PASSWORD  = process.env.WINDOWS_SIGN_TOKEN_PASSWORD_NEW;

const timeout = parseInt(process.env.SIGNTOOL_TIMEOUT, 10) || 10 * 60 * 1000;

exports.default = async function (configuration) {
    // console.log(configuration);
    const vm = new _vm.VmManager();
    const tempDirManager = new tempFile.TmpDir('packager');

    let argsOld = computeSignToolArgs(configuration, vm, await getCert(tempDirManager, OLD_CERTIFICATE_B64), OLD_TOKEN_PASSWORD);
    console.log('signing old');
    await sign(vm, argsOld);
    
    // configuration.isNest // gets set to true for sha256, false for sha1, we set it to true for any additional certs
    configuration.isNest = true;
    let argsNew = computeSignToolArgs(configuration, vm, await getCert(tempDirManager, NEW_CERTIFICATE_B64), NEW_TOKEN_PASSWORD);
    console.log('signing new');
    await sign(vm, argsNew);

    tempDirManager.cleanup();
};

async function sign (vm, args) {
    const vendorPath = await windowsCodeSign.getSignVendorPath();
    const signTool = path.join(vendorPath, "windows-10", process.arch, "signtool.exe");
    // console.log(signTool);
    // console.log(args);

    try {
        await vm.exec(signTool, args, {timeout, env: process.env})
    } catch (e) {
        throw new Error('signing failed');
        if (e.message.includes("The file is being used by another process") || e.message.includes("The specified timestamp server either could not be reached")) {
            console.warn(`First attempt to code sign failed, another attempt will be made in 2 seconds: ${e.message}`)
            await new Promise((resolve, reject) => {
                setTimeout(() => {
                    vm.exec(signTool, args, {timeout, env: process.env})
                        .then(resolve)
                        .catch(reject)
                }, 2000)
            })
        }
        throw e
    }
}

async function getCert(tempDirManager, base64) {
    return await codeSign.downloadCertificate(base64, tempDirManager, process.cwd()).then(path => {
        return path;
    });
}

// Yoinked and adapted from:
// https://github.com/electron-userland/electron-builder/blob/d6c9d8fa704d0fe9bf3ed419c5dd4d59118695a8/packages/app-builder-lib/src/codeSign/windowsCodeSign.ts#L191
function computeSignToolArgs(options, vm, certificateFile, password) {
    const inputFile = vm.toVmFile(options.path)
    const args = ["sign"];
  
    if (process.env.ELECTRON_BUILDER_OFFLINE !== "true") {
      const timestampingServiceUrl = options.options.timeStampServer || "http://timestamp.verisign.com/scripts/timstamp.dll"
      args.push(options.isNest || options.hash === "sha256" ? "/tr" : "/t", options.isNest || options.hash === "sha256" ? (options.options.rfc3161TimeStampServer || "http://timestamp.comodoca.com/rfc3161") : timestampingServiceUrl)
    }
  
    const certExtension = path.extname(certificateFile)
    if (certExtension === ".p12" || certExtension === ".pfx") {
        args.push("/f", vm.toVmFile(certificateFile))
    }
    else {
        throw new Error(`Please specify pkcs12 (.p12/.pfx) file, ${certificateFile} is not correct`)
    }
  
    if (options.hash !== "sha1") {
      args.push("/fd", options.hash)
      if (process.env.ELECTRON_BUILDER_OFFLINE !== "true") {
        args.push("/td", "sha256")
      }
    }
  
    if (options.name) {
      args.push("/d", options.name)
    }
  
    if (options.site) {
      args.push("/du", options.site)
    }
  
    // msi does not support dual-signing
    if (options.isNest) {
      args.push("/as")
    }
  
    if (password) {
      args.push("/p", password)
    }
  
    if (options.options.additionalCertificateFile) {
      args.push("/ac", vm.toVmFile(options.options.additionalCertificateFile))
    }
  
    const httpsProxyFromEnv = process.env.HTTPS_PROXY
  
    // https://github.com/electron-userland/electron-builder/issues/2875#issuecomment-387233610
    args.push("/debug")
    // must be last argument
    args.push(inputFile)
  
    return args
  }