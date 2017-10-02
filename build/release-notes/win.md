* Added 32 bit builds
* Updated to the latest version of electron.
* Zooming in and out is now more finely grained, the actual size keyboard shortcut no longer conflict with the main window shortcut, and the interaction with incremental and pinch zooming has been improved.
* Maximise and full screen are now separate options, and they're now remembered properly between restarts.
* Added a menu item for opening the config file in an editor.
* Added user script and style support via the config file `userScriptPath` and `userStylePath` options. You will be prompted whether to trust these files when they're first detected and they can be disabled with the `acceptUserScripts` and `acceptUserStyles` config options.
* Added a menu item to reveal the log file.
* Improve filenames for downloads triggered with alt/option-click.
* Fixed duplicate separators in context menus.
* Added a cmd/ctrl-t shortcut to open a new browser tab.
* Added automatic crash reporting via sentry.io
* 