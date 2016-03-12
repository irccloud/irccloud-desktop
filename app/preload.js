/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var buildEditorContextMenu = remote.require('electron-editor-context-menu');
var SpellCheckProvider = require('electron-spell-check-provider');
var config = remote.getGlobal('config');
var contextMenu = require('./context_menu');

var selection;
function resetSelection() {
  selection = {
    isMisspelled: false,
    spellingSuggestions: []
  };
}
resetSelection();

window.addEventListener('mousedown', resetSelection);

webFrame.setSpellCheckProvider(
  remote.app.getLocale(),
  true,
  new SpellCheckProvider(remote.app.getLocale()).on('misspelling', function(suggestions) {
    if (window.getSelection().toString()) {
      selection.isMisspelled = true;
      selection.spellingSuggestions = suggestions.slice(0, 3);
    }
}));


/* Right-click context menus */
window.addEventListener('contextmenu', function(e) {
  var menu;

  if (e.target.closest('textarea, input, [contenteditable="true"]')) {
      menu = buildEditorContextMenu(selection);
  } else {
      menu = contextMenu.build(window, e.target);
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
