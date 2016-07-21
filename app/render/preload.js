/* Javascript injected into the page on-load */
var remote = require('electron').remote;

window.IRCCLOUD_DESKTOP_VERSION = remote.app.getVersion();

window.addEventListener('wheel', function (e) {
  // console.log('onwheel');
});

require('./zoom')();
require('./spellcheck')();
require('./irc-url')();
