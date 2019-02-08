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

  window.IRCCLOUD_DESKTOP_VERSION = remote.app.getVersion();

  window.addEventListener('wheel', function (e) {
    // console.log('onwheel');
  });

  if (is.dev()) {
    window.__devtron = {require: require, process: process};
    require('devtron').install();
  }

  require('./focus')();
  require('./zoom')();
  require('./spellchecker')();
  require('./irc-url')();
  require('./notification')();
  require('./user')();
  require('./current_buffer')();

})();
