var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

function setupIRCUrl() {
  ipcRenderer.on('set-irc-url', function (event, url) {
    webFrame.executeJavaScript(
      'if (SESSIONVIEW) { SESSIONVIEW.navigate("?/irc_url=' + url + '", {trigger: true}) } 0;'
    );
  });
}

module.exports = setupIRCUrl;
