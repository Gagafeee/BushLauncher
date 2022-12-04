const { ipcRenderer } = require('electron');
const fs = require('fs');
const isNetworkAvailable = navigator.onLine;
const text = document.querySelector("#state");
var child = require('child_process').execFile;
var loaded = false;
const prefix = "[Loader]: ";

function preLoad() {
    if (!loaded) {
        console.log(prefix + "STARTING");
        let offline = false;

        //check network
        if (!isNetworkAvailable) {
            text.innerText = "Starting Offline mode";
            offline = true;
        }
        //check for updates
        if (!offline) {
            const checkForUpdatesProcess = () => {
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
            checkForUpdatesProcess().then(() => {
                text.innerText = "there isn't any updates available";
                //if download file exist in temp delete it
                ipcRenderer.invoke("getTempPath").then((tempPath) => {
                    const downloadFilePath = tempPath + "\\bushLauncherUpdate.exe";
                    if (fs.existsSync(downloadFilePath)) {
                        fs.unlinkSync(downloadFilePath);
                        console.log(prefix + "Found download file in temp, deleting it");
                    }
                })
                loaded = true;
                ipcRenderer.postMessage("starting:ChekedForUpdate");

            })
        }


    } else {
        console.error("FATAL: APP ALREADY LOADED");
    }

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

function Start() {
    const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
    const { Authenticator, authProviderType } = require('./modules/authenticator');
    const loader = document.querySelector("#MainLoader");

    const Setup = () => {
        return new Promise((resolve, reject) => {
            processPrefix = "[Initializing]: ";
            /*replace all version textes */
            ipcRenderer.invoke("getVersion").then((version) => {
                    Array.from(document.querySelectorAll(".app-version")).forEach((e) => {
                        e.innerText = version;
                    })
                })
                //
                /*Loading menu */
            document.querySelector("#MENU").addEventListener("dblclick", () => {
                ipcRenderer.invoke("isWindowMaximized").then((isMaximized) => {
                    ipcRenderer.postMessage(isMaximized ? "unmaximize-window" : "maximize-window");
                })
            })
            document.querySelector("#close-btn").addEventListener("click", () => {
                ipcRenderer.postMessage("closeApp");
            });
            document.querySelector("#minimize-btn").addEventListener("click", () => {
                ipcRenderer.postMessage("minimize-window");
            })
            document.querySelector("#max-unmax-btn").addEventListener("click", () => {
                const icon = document.querySelector("#max-unmax-btn").firstElementChild;
                ipcRenderer.invoke("isWindowMaximized").then((isMaximized) => {
                    ipcRenderer.postMessage(isMaximized ? "unmaximize-window" : "maximize-window");
                })
                ipcRenderer.invoke("isWindowMaximized").then((isMaximized) => {
                    // Change the middle maximize-unmaximize icons.
                    if (!isMaximized) {
                        icon.backgroundImage = "url(./ressources/graphics/icons/clone.svg)";
                    } else {
                        icon.backgroundImage = "url(./ressources/graphics/icons/square.svg)";
                    }
                })


            })
            resolve()
        })
    }
    const Login = () => {
        processPrefix = "[Login in]: ";
        return new Promise((resolve, reject) => {
            const isListEmpty = Authenticator.isAccountList() ? false : true;
            console.log(prefix + processPrefix + "list is empty: " + isListEmpty);
            if (!isListEmpty) {
                const account = {
                    id: Authenticator.getLastLoggedAccountId(),
                    account: Authenticator.getAccount(Authenticator.getLastLoggedAccountId())
                }
                const Validate = () => {
                        return new Promise((resolve, reject) => {
                            if (!Authenticator.isAccountValid(account.account)) {
                                //user must reconnect to his account
                                console.log(prefix + processPrefix + "Selected Account no longer valid, waiting for reconect");
                                Authenticator.validateMSAccount(account.id).then(() => {
                                    resolve(true)
                                }).catch((err) => {
                                    console.error(err);
                                    resolve(false);
                                });
                            } else {
                                console.log(prefix + processPrefix + "Account already valid");
                                resolve(true)
                            }
                        })

                    }
                    //login
                Validate().then((isValid) => {
                    if (isValid) {
                        Authenticator.Login(authProviderType.RAW, account.account).then(() => {
                            Authenticator.SwitchToAccount(account.id);
                            resolve(account)
                        }).catch((err) => {
                            notificationsManager.CreateNotification(NotificationsType.Error, "Cannot loggin: " + err)
                            console.error(err);
                            reject(err);
                        })
                    } else {
                        console.error(prefix + "Cannot Validate account");
                        reject("Cannot Valid account");
                    }
                })



            } else {
                console.log(prefix + processPrefix + "No account exists");
                //there is no account to log
                //display login panel
                console.log("login panel");
            }
        })
    }

    console.log(prefix + "Starting...");
    console.log(prefix + "Initializing...");
    Setup().then(() => {
        console.log(prefix + "Login in...");
        Login().then((account) => {
            console.log(prefix + "Loaded Successfully");
            loader.style.display = "none";
            notificationsManager.CreateNotification(NotificationsType.Info, "Logged as: " + account.account.username, 5000)
        }).catch((err) => {
            console.error(prefix + "Cannot load" + err);
        })
    }).catch((err) => {
        console.error(prefix + "Cannot load" + err);
    })






    /**/

}

module.exports = { preLoad, Start }