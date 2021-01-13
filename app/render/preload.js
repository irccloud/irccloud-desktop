/* Javascript injected into the page on-load */
(function () {
  const { contextBridge, ipcRenderer } = require('electron');

  var log = require('electron-log');
  var is = require('electron-is');

  log.transports.file.level = 'info';
  var configHost = ipcRenderer.sendSync('preload-channel-sync', 'config', 'host');
  if (window.location.origin !== configHost) {
    log.debug('skipping preload', window.location.origin);
    return;
  }

  log.debug('preload');

  var version = ipcRenderer.sendSync('preload-channel-sync', 'version');
  contextBridge.exposeInMainWorld('IRCCLOUD_ELECTRON', {
    version: version,
    setUser: function (result) {
      ipcRenderer.send('set-user', result);
    },
    notificationClick: function () {
      log.debug('preload notificationClick');
      ipcRenderer.send('preload-channel-async', 'activate');
    },
    setPinned: function (result) {
      ipcRenderer.send('set-pinned', result);
    }
  });

  require('./zoom')();
  require('./notification')();
  require('./irc-url')();
  require('./spellcheck')();
  require('./user')();
  require('./pinned')();

})();
