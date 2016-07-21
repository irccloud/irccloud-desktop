/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;

window.IRCCLOUD_DESKTOP_VERSION = remote.app.getVersion();

window.addEventListener('wheel', function (e) {
  // console.log('onwheel');
});

require('./zoom')();
require('./spellcheck')();

ipcRenderer.on('set-irc-url', function (event, url) {
  if (SESSIONVIEW) {
    SESSIONVIEW.navigate('?/irc_url=' + url, {trigger: true});
  }
});
