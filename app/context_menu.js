const electron = require('electron');

const remote = electron.remote;
const clipboard = electron.clipboard;
const Shell = electron.shell;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

module.exports = {
    build: function(window, e) {
        var target = e.target;
        var template = [];
        if (target.closest('a')) {
            target = target.closest('a');
            template.push({
                label: 'Copy Link Address',
                click: function (e, focusedWindow) {
                  clipboard.writeText(target.href);
                }
            });
            template.push({
                label: 'Open Link in Browser',
                click: function (e, focusedWindow) {
                  Shell.openExternal(target.href, {
                    activate: true
                  });
                }
            });
            template.push({
                label: 'Open Link in Browser (Background)',
                click: function (e, focusedWindow) {
                  Shell.openExternal(target.href, {
                    activate: false
                  });
                }
            });
        } else {
            if (window.getSelection().toString()) {
                template.push({
                    label: 'Copy',
                    role: 'copy'
                });
            } else {
                template.push({
                    label: 'Back',
                    enabled: remote.getCurrentWebContents().canGoBack(),
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.webContents.goBack();
                        } 
                    }
                });
                template.push({
                    label: 'Forward',
                    enabled: remote.getCurrentWebContents().canGoForward(),
                    click: function (item, focusedWindow) {
                        if (focusedWindow) {
                            focusedWindow.webContents.goForward();
                        }
                    }
                });
                template.push({
                    label: 'Reload',
                    click: function(item, focusedWindow) {
                        if (focusedWindow) {
                          focusedWindow.webContents.reloadIgnoringCache();
                        }
                    }
                });
            }
        }
        
        template = [...template, {
            type: 'separator'
        }, {
            label: 'Inspect Element',
            click: function(item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.webContents.inspectElement(e.pageX, e.pageY);
                    if (focusedWindow.isDevToolsOpened()) {
                        focusedWindow.devToolsWebContents.focus();
                    }
                }
            }
        }];

        if (process.platform == 'darwin') {
            template.push({
                label: 'Services',
                role: 'services',
                submenu: []
            });
        }
        return Menu.buildFromTemplate(template);
    }
};
