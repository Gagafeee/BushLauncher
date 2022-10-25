// main.js

// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const isMac = process.platform === "darwin";
const template = [{
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
}, ];
const menu = Menu.buildFromTemplate(template);


Menu.setApplicationMenu(menu);

module.exports = { menu };
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        center: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'hidden',
        icon: './ressources/graphics/icon.png',
        titre: 'Bush Launcher',
        transparent: true,
        frame: false
    })

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()
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
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

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