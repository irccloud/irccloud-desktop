const remote = require('electron').remote;
const clipboard = require('electron').clipboard;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

module.exports = {
    build: function(target) {
        var template = [
            {
                label: 'Copy Link Address',
                click: function (e, focusedWindow) {
                  clipboard.writeText(target.href);
                }
            }
        ];

        if (process.platform == 'darwin') {
            template = [...template,
                {
                    type: 'separator'
                },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                }
            ];
        }
        return Menu.buildFromTemplate(template);
    }
};
