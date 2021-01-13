var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

function setupZoom () {
  var initialLevel = ipcRenderer.sendSync('preload-channel-sync', 'config', 'zoom');
  webFrame.setZoomLevel(initialLevel);
  ipcRenderer.on('update-zoom-level', function (event, level) {
    webFrame.setVisualZoomLevelLimits(1, 1);
    webFrame.setZoomLevel(level);
    webFrame.setVisualZoomLevelLimits(1, 3);
  });
}

module.exports = setupZoom;
