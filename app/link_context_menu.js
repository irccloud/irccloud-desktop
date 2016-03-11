const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

module.exports = {
    build: function(target) {
        var template = [
            {
                label: 'Copy Link Address',
                role: 'copy'
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
