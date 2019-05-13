// Not currently used, using spellcheck.js instead for compatibility with electron 5
// breaking API change:
// https://github.com/electron-userland/electron-spellchecker/issues/144
// To switch back to this method in future, check the changelog for anything
// relevant. Also, require this from the preload script and uncomment below lines
// from app/context_menu.js
// if (props.misspelledWord) {
//   return;
// }

var remote = require('electron').remote;
var ipcRenderer = require('electron').ipcRenderer;

var spellchecker = require('electron-spellchecker');

var config = remote.getGlobal('config');

var spellCheckWhileTyping = config.get('spellcheck');

function handleSpellcheckToggle () {
  ipcRenderer.on('disable-spellcheck', function (event) {
    disableSpellcheck();
  });
  ipcRenderer.on('enable-spellcheck', function (event) {
    enableSpellcheck();
  });
}

function enableSpellcheck () {
  spellCheckWhileTyping = true;
}
function disableSpellcheck () {
  spellCheckWhileTyping = false;
}

function patchSpellCheckHandler () {
  var original = spellchecker.SpellCheckHandler.prototype.handleElectronSpellCheck;
  spellchecker.SpellCheckHandler.prototype.handleElectronSpellCheck = function () {
    var ret = original.apply(this, arguments);
    if (spellCheckWhileTyping) {
      return ret;
    } else {
      return true;
    }
  };
}

function setupSpellcheck () {
  handleSpellcheckToggle();
  patchSpellCheckHandler();

  var spellCheckHandler = new spellchecker.SpellCheckHandler();
  // No support for multiple languages at the moment
  // https://github.com/electron-userland/electron-spellchecker/issues/74
  // https://github.com/irccloud/irccloud-desktop/issues/97#issuecomment-350684063
  spellCheckHandler.switchLanguage(remote.getBuiltin('app').getLocale());
  spellCheckHandler.autoUnloadDictionariesOnBlur();

  var contextMenuBuilder = new spellchecker.ContextMenuBuilder(spellCheckHandler);
  var contextMenuListener = new spellchecker.ContextMenuListener(function (info) {
    // https://github.com/sindresorhus/electron-context-menu/issues/11
    // Only use this context menu for misspellings
    // See app/context_menu.js for full context menu
    // Note, if we're using this spellchecker, add the following to the
    // 'context-menu' handler
    // if (props.misspelledWord) {
    //   return;
    // }
    if (!info.misspelledWord) {
      return;
    }
    contextMenuBuilder.showPopupMenu(info);
  });

  document.addEventListener("DOMContentLoaded", function (event) {
    spellCheckHandler.attachToInput();
  });
}

module.exports = setupSpellcheck;