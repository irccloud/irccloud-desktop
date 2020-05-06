const electron = require('electron');
const TouchBar = electron.TouchBar;
const TouchBarLabel = TouchBar.TouchBarLabel;
const TouchBarButton = TouchBar.TouchBarButton;
const TouchBarGroup = TouchBar.TouchBarGroup;
const TouchBarSpacer = TouchBar.TouchBarSpacer;
const ipcMain = electron.ipcMain;

module.exports = {
  render: function (mainWindow, pinnedBuffers) {
    const chanSwitch = new TouchBarButton({
      label: 'Jump to…',
      click: () => {
        if (!mainWindow) {
          return;
        }

        mainWindow.webContents.executeJavaScript(
          'if (SESSIONVIEW) { SESSIONVIEW.channelSwitcher.toggle(); } 0;'
        );
      }
    });

    var touchbarItems = [
      chanSwitch,
      new TouchBarSpacer({ size: 'large' })
    ];

    var items = pinnedBuffers.slice(0, 5).forEach((item) => {
      var bid = item[0];
      var label = item[1];
      var url = item[2];
      var button = new TouchBarButton({
        label: label,
        click: () => {
          if (!mainWindow) {
            return;
          }

          mainWindow.webContents.executeJavaScript(
            'if (SESSIONVIEW) { SESSIONVIEW.navigate("' + url + '", {trigger: true}); } 0;'
          );
        }
      });
      touchbarItems.push(button);
    });

    const touchBar = new TouchBar({
      items: touchbarItems
    });

    mainWindow.setTouchBar(touchBar);
  },
  setup: function (mainWindow) {
    ipcMain.on('set-pinned', (event, pinned) => {
      this.render(mainWindow, pinned);
    });

    this.render(mainWindow, []);
  }
};
