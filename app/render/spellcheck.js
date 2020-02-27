var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

function setupSpellcheck() {
  ipcRenderer.on('enable-spellcheck', function (event) {
    webFrame.executeJavaScript(
      'document.body.spellcheck = true; 0;'
    );
  });
  ipcRenderer.on('disable-spellcheck', function (event) {
    webFrame.executeJavaScript(
      'document.body.spellcheck = false; 0;'
    );
  });
}

module.exports = setupSpellcheck;
