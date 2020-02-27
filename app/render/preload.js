/* Javascript injected into the page on-load */
(function () {
  var log = require('electron-log');
  log.transports.file.level = 'info';
  var remote = require('electron').remote;
  if (window.location.origin !== remote.getGlobal('config').get('host')) {
    log.debug('skipping preload', window.location.origin);
    return;
  }

  log.debug('preload');

  var is = require('electron-is');
  var version = remote.getBuiltin('app').getVersion();
  remote.getCurrentWindow().webContents.executeJavaScript(
    'window.IRCCLOUD_DESKTOP_VERSION = "' + version + '"; 0;'
  );

  if (is.dev()) {
    window.__devtron = {require: require, process: process};
    require('devtron').install();
  }

  require('./focus')();
  require('./zoom')();
  require('./notification')();
  require('./irc-url')();
  require('./spellcheck')();
  require('./user')();

})();
