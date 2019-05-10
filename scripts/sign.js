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
    // Only process on one hash, we set hashes manually to control the order
    if (configuration.hash === 'sha1') {
        return;
    }
    const vm = new _vm.VmManager();
    const tempDirManager = new tempFile.TmpDir('packager');
    
    // Appending each sig puts it after the top one, so the order here is a bit odd

    // 1
    let argsOld1 = computeSignToolArgs(configuration, vm, "sha1", false, await getCert(tempDirManager, OLD_CERTIFICATE_B64), OLD_TOKEN_PASSWORD);
    console.log(`signing old sha1 ${configuration.path}`);
    await sign(vm, argsOld1);

    // 4
    let argsNew256 = computeSignToolArgs(configuration, vm, "sha256", true, await getCert(tempDirManager, NEW_CERTIFICATE_B64), NEW_TOKEN_PASSWORD);
    console.log(`signing new sha256 ${configuration.path}`);
    await sign(vm, argsNew256);

    // // 3
    // let argsNew1 = computeSignToolArgs(configuration, vm, "sha1", true, await getCert(tempDirManager, NEW_CERTIFICATE_B64), NEW_TOKEN_PASSWORD);
    // console.log(`signing new sha1 ${configuration.path}`);
    // await sign(vm, argsNew1);
    
    // 2
    let argsOld256 = computeSignToolArgs(configuration, vm, "sha256", true, await getCert(tempDirManager, OLD_CERTIFICATE_B64), OLD_TOKEN_PASSWORD);
    console.log(`signing old sha256 ${configuration.path}`);
    await sign(vm, argsOld256);

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
function computeSignToolArgs(options, vm, hash, append, certificateFile, password) {
    const inputFile = vm.toVmFile(options.path)
    const args = ["sign"];
  
    if (process.env.ELECTRON_BUILDER_OFFLINE !== "true") {
        const timestampingServiceUrl = hash === "sha256" ? "http://timestamp.comodoca.com/rfc3161" :  "http://timestamp.verisign.com/scripts/timstamp.dll";
        const timestampArg = hash === "sha256" ? "/tr" : "/t";
        args.push(timestampArg, timestampingServiceUrl);
    }
  
    const certExtension = path.extname(certificateFile)
    if (certExtension === ".p12" || certExtension === ".pfx") {
        args.push("/f", vm.toVmFile(certificateFile))
    }
    else {
        throw new Error(`Please specify pkcs12 (.p12/.pfx) file, ${certificateFile} is not correct`)
    }
  
    args.push("/fd", hash)
    if (hash === "sha256") {
        if (process.env.ELECTRON_BUILDER_OFFLINE !== "true") {
            args.push("/td", hash)
        }
    }
  
    if (options.name) {
      args.push("/d", options.name)
    }
  
    if (options.site) {
      args.push("/du", options.site)
    }
  
    // msi does not support dual-signing
    if (append) {
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