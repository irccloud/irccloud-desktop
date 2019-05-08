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

var spellchecker = require('spellchecker');

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

function setupSpellcheck () {
  resetSuggestions();

  ipcRenderer.on('disable-spellcheck', function (event) {
    disableSpellcheck();
  });
  ipcRenderer.on('enable-spellcheck', function (event) {
    enableSpellcheck();
  });

  var locale = remote.getBuiltin('app').getLocale();
  var provider = {
    spellCheck: function (words, callback) {
      if (!spellCheckWhileTyping) {
        return;
      }
      setTimeout(function () {
        var misspellings = [];
        var suggestions = {};
        words.forEach(function (x) {
          if (spellchecker.isMisspelled(x)) {
            misspellings.push(x);
            if (!suggestions[x]) {
              suggestions[x] = spellchecker.getCorrectionsForMisspelling(x).slice(0,3);
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
