const { notarize } = require('electron-notarize');
const log = require("builder-util/out/log").log;

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (context.packager.config.extraMetadata.irccloud.local_build) {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  const appPath = `${appOutDir}/${appName}.app`;
  const appBundleId = 'com.irccloud.desktop';

  log.info({appBundleId: appBundleId, appPath: appPath}, 'notarizing');

  return await notarize({
    appBundleId: appBundleId,
    appPath: appPath,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
};
