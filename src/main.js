'use strict'
const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const downloader = require('./scripts/downloader');
const axios = require("axios");
const { createWriteStream, existsSync, unlinkSync, copyFile, readFileSync } = require("fs");
const { join } = require('path');

const isMac = process.platform === "darwin";
const isDevelopment = process.env.NODE_ENV !== 'production'

//setting frame top menu
const template = [{
    label: "File",
    submenu: [isMac ? { role: "close" } : { role: "quit" }],
}, ];
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
module.exports = { menu };


// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {

    const window = new BrowserWindow({
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
    window.loadFile('src/loading.html');

    if (isDevelopment) {
        window.webContents.openDevTools()
    }

    window.on('closed', () => {
        mainWindow = null
    })

    window.webContents.on('devtools-opened', () => {
        window.focus()
        setImmediate(() => {
            window.focus()
        })
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
    return window;

}

// quit application when all windows are closed
app.on('window-all-closed', () => {
        // on macOS it is common for applications to stay open until the user explicitly quits
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })
    // create main BrowserWindow when electron is ready
app.on('ready', () => {
    setTimeout(() => {
        mainWindow = createMainWindow();
        ipcMain.on("starting:ChekedForUpdate", () => {
            mainWindow.loadFile("./src/app.html");
        })
    }, 300);

})
ipcMain.on("closeApp", () => {
    app.quit();
})

ipcMain.handle("getTempPath", () => { return app.getPath("temp") })
ipcMain.handle("checkForUpdates", () => {
    return new Promise((resolve, reject) => {
        downloader.checkForUpdatesExist().then((potientialUpdate) => {
                resolve(potientialUpdate);
            })
            .catch((err) => {
                console.error("Cannot get if newer version exist:")
                console.error(err);
                reject(err);
            })
    })
})

ipcMain.handle("DownloadUpdate", (e, url) => {
    return new Promise((resolve, reject) => {
        console.log("updating...");
        console.log("downloading : " + url);
        axios({
            url: [url],
            method: 'get',
            responseType: "stream",
            onDownloadProgress: (progressEvent) => {
                const DownloadPercentage = Math.ceil(((progressEvent.loaded * 100) / progressEvent.total * 1) / 1);
                console.log("Downloading: " + DownloadPercentage + "%");
                mainWindow.webContents.send("DownloadUpdate:updateCallback", DownloadPercentage);

            },
        }).then((axiosResponse) => {
            try {
                // You can replace .berry with anything you want except .asar!
                const tempDir = app.getPath("temp");
                console.log(tempDir);
                axiosResponse.data.pipe(createWriteStream(join(tempDir, "bushLauncherUpdate.exe")))
                    .on("finish", () => {
                        resolve(join(tempDir, "bushLauncherUpdate.exe"));
                    })
                    .on("error", (error) => { reject(error) })
                    .on("onDownloadProgress", (progress) => { console.log(progress); });

            } catch (err) {
                console.error(err);
                reject(err);
            };
        }).catch(() => {
            reject("Couldn't update, please restart the launcher.");
            console.error("Couldn't download the update");
        });
    })

})




/*app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow()
    }
})*/