/* eslint-env browser */
/* global SESSION, SESSIONVIEW */
/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;
var SpellCheckProvider = require('electron-spell-check-provider');
var config = remote.getGlobal('config');

window.IRCCLOUD_DESKTOP_VERSION = remote.app.getVersion();

var selection;
function resetSuggestions() {
  setSuggestions([]);
}
function setSuggestions(suggestions) {
  ipcRenderer.send('set-spelling-suggestions', suggestions);
  selection = {
    isMisspelled: suggestions.length > 0,
    spellingSuggestions: suggestions
  };
}
resetSuggestions();

window.addEventListener('mousedown', resetSuggestions);

webFrame.setZoomLevel(config.get('zoom'));
ipcRenderer.on('update-zoom-level', function (event) {
  webFrame.setZoomLevel(config.get('zoom'));
});
ipcRenderer.on('set-irc-url', function (event, url) {
  if (SESSIONVIEW) {
    SESSIONVIEW.ircUrl(url);
  }
});
ipcRenderer.on('disable-spellcheck', function (event) {
  disableSpellcheck();
});
ipcRenderer.on('enable-spellcheck', function (event) {
  enableSpellcheck();
});

var spellCheckWhileTyping = config.get('spellcheck');
function enableSpellcheck () {
  spellCheckWhileTyping = true;
}
function disableSpellcheck () {
  spellCheckWhileTyping = false;
}

function setupSpellcheck () {
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

setupSpellcheck();
