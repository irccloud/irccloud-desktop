const { notarize } = require('electron-notarize');
const log = require("builder-util/out/log").log;

exports.default = async function afterSign(context) {
  const { electronPlatformName, appOutDir, outDir, packager } = context;

  // Don't notarize on pull requests
  if (
    process.env.GITHUB.EVENT_NAME == 'pull_request' ||
    process.env.TRAVIS_EVENT_TYPE == 'pull_request'
    process.env.APPVEYOR_PULL_REQUEST_NUMBER > 0
  ) {
    return;
  }

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (
    packager.config.extraMetadata &&
    packager.config.extraMetadata.irccloud &&
    packager.config.extraMetadata.irccloud.local_build
  ) {
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;
  const appBundleId = packager.config.appId;

  log.info({appBundleId: appBundleId, appPath: appPath}, 'notarizing');

  return await notarize({
    appBundleId: appBundleId,
    appPath: appPath,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
  });
};
