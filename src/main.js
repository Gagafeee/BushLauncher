// main.js
// this should be placed at top of main.js to handle setup events quickly
// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const isMac = process.platform === "darwin";
const template = [{
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
}, ];
const menu = Menu.buildFromTemplate(template);
if (handleSquirrelEvent(app)) { // squirrel event handled and app will exit in 1000ms, so don't do anything else
    return;
}

Menu.setApplicationMenu(menu);

module.exports = { menu };
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 550,
        minWidth: 800,
        minHeight: 550,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'hidden',
        icon: './src/ressources/graphics/icon.png',
        titre: 'Bush Launcher',
        transparent: true,
        frame: false
    })

    // and load the index.html of the app.
    mainWindow.loadFile('src/index.html')

    // Open the DevTools.
    //mainWindow.webContents.openDevTools()


}


// Register an event listener. When ipcRenderer sends mouse click co-ordinates, show menu at that position.
ipcMain.on(`display-app-menu`, function(e, args) {
    if (isWindows && mainWindow) {
        menu.popup({
            window: mainWindow,
            x: args.x,
            y: args.y
        });
    }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
        /*menu event*/
    ipcMain.on('close-app', () => {
        app.quit()
    })

    ipcMain.on('minimize-window', () => {
        BrowserWindow.getFocusedWindow().minimize();
    })

    ipcMain.handle("isWindowMaximized", async() => {
        return BrowserWindow.getFocusedWindow().isMaximized();
    })
    ipcMain.on('maximize-window', () => {
        BrowserWindow.getFocusedWindow().maximize();
    })
    ipcMain.on('unmaximize-window', () => {
        BrowserWindow.getFocusedWindow().unmaximize();
    })
    ipcMain.handle("getVersion", () => {
        return app.getVersion();
    })
    ipcMain.on("set-progress-bar", (e, p) => { setProgressBar(p) })
    ipcMain.on("openDevTool", () => {
        BrowserWindow.getFocusedWindow().webContents.openDevTools()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.



function setProgressBar(percent) {
    const c = percent.p / 100;
    console.log("setProgressBar: " + c +" : "+ percent.type);
    BrowserWindow.getFocusedWindow().setProgressBar(c, {
        mode: percent.type
    });
}



function handleSquirrelEvent(application) {
    if (process.argv.length === 1) {
        return false;
    }
    const ChildProcess = require('child_process');
    const path = require('path');
    const appFolder = path.resolve(process.execPath, '..');
    const rootAtomFolder = path.resolve(appFolder, '..');
    const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
    const exeName = path.basename(process.execPath);
    const spawn = function(command, args) {
        let spawnedProcess, error;
        try {
            spawnedProcess = ChildProcess.spawn(command, args, {
                detached: true
            });
        } catch (error) {}
        return spawnedProcess;
    };
    const spawnUpdate = function(args) {
        return spawn(updateDotExe, args);
    };
    const squirrelEvent = process.argv[1];
    switch (squirrelEvent) {
        case '--squirrel-install':
        case '--squirrel-updated': // Optionally do things such as:// - Add your .exe to the PATH// - Write to the registry for things like file associations and//   explorer context menus// Install desktop and start menu shortcuts
            spawnUpdate(['--createShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;
        case '--squirrel-uninstall': // Undo anything you did in the --squirrel-install and// --squirrel-updated handlers// Remove desktop and start menu shortcuts
            spawnUpdate(['--removeShortcut', exeName]);
            setTimeout(application.quit, 1000);
            return true;
        case '--squirrel-obsolete': // This is called on the outgoing version of your app before// we update to the new version - it's the opposite of// --squirrel-updated
            application.quit();
            return true;
    }
};