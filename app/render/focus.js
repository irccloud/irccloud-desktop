var remote = require('electron').remote;

// TODO fixed in electron 7.x, test removing this then
function setupFocus () {
  // https://github.com/electron/electron/issues/7125
  // If we load/refresh while the window is hidden or blurred, document.hasFocus is wrong
  // We need to first show the window it it's hidden (this is probably ok if a user manually
  // chose to refresh) or give it focus (e.g. if dev tools is open) then blur it again to properly
  // set the document's focus state
  if (!remote.getCurrentWindow().isVisible() || !remote.getCurrentWindow().isFocused()) {
    if (!remote.getCurrentWindow().isVisible()) {
      remote.getCurrentWindow().show();
    } else {
      remote.getCurrentWindow().focus();
    }
    remote.getCurrentWindow().blur();
  }
}

module.exports = setupFocus;
