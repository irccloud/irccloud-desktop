var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

var config = remote.getGlobal('config');

function setupZoom () {
  webFrame.setZoomLevel(config.get('zoom'));
  ipcRenderer.on('update-zoom-level', function (event) {
    webFrame.setZoomLevel(config.get('zoom'));
  });
}

module.exports = setupZoom;
