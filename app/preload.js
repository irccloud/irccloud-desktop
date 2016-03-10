/* Javascript injected into the page on-load */
var remote = require('electron').remote;
var webFrame = require('electron').webFrame;
var SpellCheckProvider = require('electron-spell-check-provider');
var buildEditorContextMenu = remote.require('electron-editor-context-menu');

/* Right-click context menu for textareas */
window.addEventListener('contextmenu', function(e) {
  if (!e.target.closest('textarea, input, [contenteditable="true"]')) return;
  var menu = buildEditorContextMenu();

  // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
  // visible selection has changed. Try to wait to show the menu until after that, otherwise the
  // visible selection will update after the menu dismisses and look weird.
  setTimeout(function() {
    menu.popup(remote.getCurrentWindow());
  }, 30);
});
