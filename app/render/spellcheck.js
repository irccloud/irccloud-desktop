var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;

var electronSpellcheck = require('electron-spellchecker');

var config = remote.getGlobal('config');

var spellCheckWhileTyping = config.get('spellcheck');

function resetSuggestions() {
  setSuggestions({});
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

function handleSpellcheckToggle () {
  ipcRenderer.on('disable-spellcheck', function (event) {
    disableSpellcheck();
  });
  ipcRenderer.on('enable-spellcheck', function (event) {
    enableSpellcheck();
  });
}

function setupSpellcheck () {
  resetSuggestions();
  handleSpellcheckToggle();

  var locale = remote.getBuiltin('app').getLocale();

  // Only using this to check misspellings
  var electronSpellCheckHandler = new electronSpellcheck.SpellCheckHandler();
  // No support for multiple languages at the moment
  // https://github.com/electron-userland/electron-spellchecker/issues/74
  // https://github.com/irccloud/irccloud-desktop/issues/97#issuecomment-350684063
  electronSpellCheckHandler.switchLanguage(locale);
  electronSpellCheckHandler.autoUnloadDictionariesOnBlur();

  var provider = {
    spellCheck: function (words, callback) {
      if (!spellCheckWhileTyping) {
        return;
      }
      setTimeout(function () {
        var misspellings = [];
        var suggestions = {};
        words.forEach(function (x) {
          if (electronSpellCheckHandler.currentSpellchecker.isMisspelled(x)) {
            misspellings.push(x);
            if (!suggestions[x]) {
              suggestions[x] = electronSpellCheckHandler.currentSpellchecker.getCorrectionsForMisspelling(x).slice(0,3);
            }
          }
        });
        setSuggestions(suggestions);
        callback(misspellings);
      }, 0);
    }
  };
  webFrame.setSpellCheckProvider(locale, provider);
}

module.exports = setupSpellcheck;
