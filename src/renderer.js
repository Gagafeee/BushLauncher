const { ipcRenderer } = require('electron');
const fs = require('fs');
const isNetworkAvailable = navigator.onLine;
const text = document.querySelector("#state");
var child = require('child_process').execFile;
var loaded = false;

function Start() {
    if (!loaded) {
        console.log("STARTING");
        let offline = false;
        if (!isNetworkAvailable) {
            text.innerText = "Starting Offline mode";
            offline = true;
        }
        if (!offline) {
            checkForUpdatesProcess().then(() => {
                text.innerText = "there isn't any updates available";
                //if download file exist in temp delete it
                ipcRenderer.invoke("getTempPath").then((tempPath) => {
                    const downloadFilePath = tempPath + "\\bushLauncherUpdate.exe";
                    if (fs.existsSync(downloadFilePath)) {
                        fs.unlinkSync(downloadFilePath);
                        console.log("Found download file in temp, deleting it");
                    }
                })

            })
        }
        /* */


        loaded = true;
    } else {
        console.error("FATAL: APP ALREADY LOADED");
    }

}

function checkForUpdatesProcess() {
    return new Promise((resolve, reject) => {
        checkForUpdates().then((potientialUpdate) => {
                if (potientialUpdate.exist) {
                    Update(potientialUpdate).then((res) => {
                        if (res.updated) {
                            text.innerText = "Restarting...";
                            ipcRenderer.postMessage("closeApp");
                        } else {
                            console.error(res);
                        }
                    }).catch((err) => {
                        console.error("Cannot Update: " + "[" + err.code + "]: " + err.message);
                    })
                } else {
                    resolve(false)
                }
            })
            .catch((err) => {
                console.error("Cannot check for Update: " + "[" + err.code + "]: " + err.message);
            })
    })
}

function checkForUpdates() {
    return new Promise((resolve, reject) => {
        if (isNetworkAvailable) {
            text.innerText = "Checking for updates...";
            ipcRenderer.invoke("checkForUpdates").then((potientialUpdate) => {
                resolve(potientialUpdate)
            }).catch((error) => {
                reject({ updated: false, code: error.code, message: error.message })
            })
        } else {
            reject({ updated: false, code: -1, message: "Network not available" })
        }
    })

}

function Update(potientialUpdate) {
    return new Promise((resolve, reject) => {
        text.innerText = "Downloading...";
        ipcRenderer.invoke("DownloadUpdate", potientialUpdate.downloadData.url)
            .then((appPath) => {
                text.innerText = "Installing...";
                child(appPath, function(err, data) {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    resolve({ updated: true, code: 200, message: "updated" });

                });

            }).catch((error) => {
                console.error("Cannot update: ");
                console.error(error);
                reject({ updated: false, code: error.code, message: error.message });
            })
    })
}

ipcRenderer.on("DownloadUpdate:updateCallback", UpdateDownloadState)

function UpdateDownloadState(e, percent) {
    text.innerText = "Downloading... [" + percent + "%]";
}

module.exports = { Start }