/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var buildEditorContextMenu = remote.require('electron-editor-context-menu');
var SpellCheckProvider = require('electron-spell-check-provider');
var config = remote.getGlobal('config');

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
  'en-US',
  true,
  new SpellCheckProvider('en-US').on('misspelling', function(suggestions) {
    if (window.getSelection().toString()) {
      selection.isMisspelled = true;
      selection.spellingSuggestions = suggestions.slice(0, 3);
    }
}));


/* Right-click context menu for textareas */
window.addEventListener('contextmenu', function(e) {
  if (!e.target.closest('textarea, input, [contenteditable="true"]')) {
      return;
  }
  var menu = buildEditorContextMenu(selection);

  // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
  // visible selection has changed. Try to wait to show the menu until after that, otherwise the
  // visible selection will update after the menu dismisses and look weird.
  setTimeout(function() {
    menu.popup(remote.getCurrentWindow());
  }, 30);
});
