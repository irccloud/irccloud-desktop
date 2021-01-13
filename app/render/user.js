var webFrame = require('electron').webFrame;

function setupUserListener() {
  webFrame.executeJavaScript(`
    document.addEventListener("DOMContentLoaded", function (event) {
      if (SESSION) {
        if (SESSION.id) {
            IRCCLOUD_ELECTRON.setUser({
                id: SESSION.id,
                name: SESSION.get("name"),
                email: SESSION.get("email")
            });
        } else {
            SESSION.once("init", () => {
                IRCCLOUD_ELECTRON.setUser({
                    id: SESSION.id,
                    name: SESSION.get("name"),
                    email: SESSION.get("email")
                });
            });
        }
        SESSION.once("noAuth", () => {
            IRCCLOUD_ELECTRON.setUser(null);
        });
      } else {
        IRCCLOUD_ELECTRON.setUser(null);
      }
    });
  `);
}

module.exports = setupUserListener;
