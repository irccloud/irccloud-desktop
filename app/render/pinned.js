var remote = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;

function listenPinned() {
  remote.getCurrentWindow().webContents.executeJavaScript(
    'new Promise((resolve, reject) => { SESSION.pinnedBuffers.once("fullChange", function () { resolve(SESSION.pinnedBuffers.map(function (b) { return [b.bid(), b.getDisambiguatedDisplayName(), b.url()]; })); } ); });'
  ).then((result) => {
    ipcRenderer.send('set-pinned', result);
    listenPinned();
  });
}

function setupPinnedHandler() {
  document.addEventListener("DOMContentLoaded", function (event) {
    remote.getCurrentWindow().webContents.executeJavaScript(
      'new Promise((resolve, reject) => { resolve(SESSION.pinnedBuffers.map(function (b) { return [b.bid(), b.getDisambiguatedDisplayName(), b.url()]; })); } );'
    ).then((result) => {
      ipcRenderer.send('set-pinned', result);
    });
    listenPinned();
  });
}

module.exports = setupPinnedHandler;
