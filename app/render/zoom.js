var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

var config = remote.getGlobal('config');

function setupZoom () {
  webFrame.setZoomLevel(config.get('zoom'));
  ipcRenderer.on('update-zoom-level', function (event) {
    var level = config.get('zoom');
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setZoomLevel(level);
    webFrame.setVisualZoomLevelLimits(1, 3);
  });
}

module.exports = setupZoom;
