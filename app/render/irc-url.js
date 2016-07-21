var ipcRenderer = require('electron').ipcRenderer;

function setupIRCUrl() {
  ipcRenderer.on('set-irc-url', function (event, url) {
    if (SESSIONVIEW) {
      SESSIONVIEW.navigate('?/irc_url=' + url, {trigger: true});
    }
  });
}

module.exports = setupIRCUrl;
