'use strict'

const { app, BrowserWindow } = require('electron')
const path = require('path')
const { format: formatUrl } = require('url')

const isDevelopment = process.env.NODE_ENV !== 'production'

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
        //titleBarStyle: 'hidden',
        icon: './src/ressources/graphics/icon.png',
        titre: 'Bush Launcher',
        //transparent: true,
        //frame: false
    })
    window.loadFile('src/index.html');

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

    return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow()
    }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    mainWindow = createMainWindow()
})