var webFrame = require('electron').webFrame;

function setupPinnedHandler() {
  webFrame.executeJavaScript(`
    document.addEventListener("DOMContentLoaded", function (event) {
      if (SESSION) {
        function setPinned () {
          IRCCLOUD_ELECTRON.setPinned(SESSION.pinnedBuffers.map(function (b) {
            return [b.bid(), b.getDisambiguatedDisplayName(), b.url()];
          }));
        }
        setPinned();
        SESSION.pinnedBuffers.on("fullChange", function () {
          setPinned();
        });
      }
    });
  `);
}

module.exports = setupPinnedHandler;
