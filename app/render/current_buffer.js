var remote = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;
var log = require('electron-log');

function setupCurrentBuffer() {
  document.addEventListener("DOMContentLoaded", function (event) {
    if (window.SESSION) {
      window.SESSION.on('currentBufferChange', function () {
        var props = null;
        if (window.SESSION.currentBuffer) {
          props = {
            bid: window.SESSION.currentBuffer.bid(),
            cid: window.SESSION.currentBuffer.getCid(),
            hostname: window.SESSION.currentBuffer.connection.getHostname(),
            port: window.SESSION.currentBuffer.connection.getPort(),
            ssl: window.SESSION.currentBuffer.connection.isSSL()
          };
          if (window.SESSION.currentBuffer.connection.isSlack()) {
            props.slack_url = window.SESSION.currentBuffer.connection.getSlackBaseUrl();
          }
        }
        ipcRenderer.send('set-current-buffer', props);
      });
    }
  });
}

module.exports = setupCurrentBuffer;
