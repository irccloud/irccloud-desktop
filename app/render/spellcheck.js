// No longer used, using spellchecker.js instead for better performance
// To switch back to this method in future, make sure to install the
// electron-spell-check-provider package, and check the changelog for anything
// relevant. Also, require this from the preload script and remove below lines
// from app/context_menu.js
// if (props.misspelledWord) {
//   return;
// }


var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

var SpellCheckProvider = require('electron-spell-check-provider');

var config = remote.getGlobal('config');

var spellCheckWhileTyping = config.get('spellcheck');

function resetSuggestions() {
  setSuggestions([]);
}
function setSuggestions(suggestions) {
  ipcRenderer.send('set-spelling-suggestions', suggestions);
}
function enableSpellcheck () {
  spellCheckWhileTyping = true;
}
function disableSpellcheck () {
  spellCheckWhileTyping = false;
}

function setupSpellcheck () {
  resetSuggestions();

  window.addEventListener('mousedown', resetSuggestions);
  ipcRenderer.on('disable-spellcheck', function (event) {
    disableSpellcheck();
  });
  ipcRenderer.on('enable-spellcheck', function (event) {
    enableSpellcheck();
  });

  var locale = remote.app.getLocale();
  var spellCheckLocale = locale;
  // electron-spell-check-provider only supports en-US, use it for any en
  if (locale === 'en' || locale.startsWith('en-')) {
    spellCheckLocale = 'en-US';
  }
  var provider = new SpellCheckProvider(spellCheckLocale).on('misspelling', function(suggestions) {
    if (window.getSelection().toString()) {
      setSuggestions(suggestions.slice(0, 3));
    }
  });
  var actualSpellCheck = provider.spellCheck;
  provider.spellCheck = function () {
    var ret = actualSpellCheck.apply(provider, arguments);
    if (spellCheckWhileTyping) {
      return ret;
    } else {
      return true;
    }
  };
  webFrame.setSpellCheckProvider(locale, true, provider);
}

module.exports = setupSpellcheck;
