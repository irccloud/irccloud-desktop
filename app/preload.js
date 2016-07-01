/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var ipcRenderer = require('electron').ipcRenderer;
var buildEditorContextMenu = remote.require('electron-editor-context-menu');
var SpellCheckProvider = require('electron-spell-check-provider');
var config = remote.getGlobal('config');
var contextMenu = require('./context_menu');

window.IRCCLOUD_DESKTOP_VERSION = remote.app.getVersion();

var selection;
function resetSelection() {
  selection = {
    isMisspelled: false,
    spellingSuggestions: []
  };
}
resetSelection();

window.addEventListener('mousedown', resetSelection);

webFrame.setZoomLevel(config.get('zoom'));
ipcRenderer.on('update-zoom-level', function (event) {
    webFrame.setZoomLevel(config.get('zoom'));
});
ipcRenderer.on('set-irc-url', function (event, url) {
    if (SESSIONVIEW) {
        SESSIONVIEW.ircUrl(url);
    }
});

function setupSpellcheck () {
  var locale = remote.app.getLocale();
  var spellCheckLocale = locale;
  // electron-spell-check-provider only supports en-US, use it for any en
  if (locale === 'en' || locale.startsWith('en-')) {
    spellCheckLocale = 'en-US';
  }
  webFrame.setSpellCheckProvider(
    locale,
    true,
    new SpellCheckProvider(spellCheckLocale).on('misspelling', function(suggestions) {
      if (window.getSelection().toString()) {
        selection.isMisspelled = true;
        selection.spellingSuggestions = suggestions.slice(0, 3);
      }
  }));
}

setupSpellcheck();

/* Right-click context menus */
window.addEventListener('contextmenu', function(e) {
  var menu;

  if (e.target.closest('textarea, input, [contenteditable="true"]')) {
      menu = buildEditorContextMenu(selection);
  } else {
      menu = contextMenu.build(window, e);
  }
  // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
  // visible selection has changed. Try to wait to show the menu until after that, otherwise the
  // visible selection will update after the menu dismisses and look weird.
  if (menu) {
    setTimeout(function() {
      menu.popup(remote.getCurrentWindow());
    }, 30);
  }
});
