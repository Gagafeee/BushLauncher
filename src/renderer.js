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
                text.innerText = "Loading...";
                //if download file exist in temp delete it
                ipcRenderer.invoke("getTempPath").then((tempPath) => {
                    const downloadFilePath = tempPath + "\\bushLauncherUpdate.exe";
                    if (fs.existsSync(downloadFilePath)) {
                        fs.unlinkSync(downloadFilePath);
                        console.log(prefix + "Found download file in temp, deleting it");
                    }
                })
                loaded = true;
                setTimeout(() => {
                    ipcRenderer.postMessage("starting:ChekedForUpdate");
                }, 2000);


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
//////////////////////////////////////////////////
const TabList = {
    VANILLA: {
        name: "VANILLA",
        type: "version"
    },
    OPTIONS: {
        name: "OPTIONS",
        type: "normal"
    }
}
Object.freeze(TabList);

class INTERFACE {
    constructor() {
        const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
        const { Authenticator, authProviderType } = require('./modules/authenticator');
        const { UserFileManager } = require('./modules/data-manager');
        const { WaitLogin } = require('./modules/authPanel/authPanel');
        this.WaitLogin = WaitLogin;
        this.UserFileManager = UserFileManager;
        this.isLogged = Authenticator.isAccountLogged();
        this.Authenticator = Authenticator;
        //apply
        const d = this.getInterfaceData()
        this.selectedTab = d.tab;
    }
    setUp() {
        const { TabSystem } = require('./modules/tabSystem');
        return new Promise((resolve, reject) => {
            if (this.isLogged) {

                console.log("Loading interface...");
                let tabList = []
                    //setUp all tabs
                Object.entries(TabList).forEach(tabData => {
                    const tab = document.querySelector("#MAIN #TabContainers .tab#" + tabData[1].name);
                    const tabButton = document.querySelector("#MAIN #TabMenu .button#" + tabData[1].name);
                    //verify button
                    if (tabButton == null) {
                        reject(new Error("Button of " + tabData[1].name + " can't be found"))
                    } else /*verify container*/ if (tab == null) {
                        reject(new Error("Container " + tabData[1].name + " can't be found"));
                    }

                    tabButton.addEventListener("click", () => {
                        this.SwitchToTab(tabData)
                    })
                    $(tab.querySelector(".content")).load("./ressources/frames/views/" + tabData[1].name + ".html")

                    tabList.push({
                        button: tabButton,
                        container: tab,
                        name: tabData[1].name
                    })

                })
                const containerTabSystem = new TabSystem(tabList);
                this.containerTabSystem = containerTabSystem;
                //select what tab will be displayed
                const selectedTab = this.getInterfaceData().tab;
                this.selectedTab = selectedTab;
                containerTabSystem.switch(selectedTab)

                //Add event listener to all dropdown 
                document.querySelectorAll(".dropdownEVENT").forEach(dropdown => {
                    dropdown.addEventListener("click", () => {
                        dropdown.dataset.open = (dropdown.dataset.open == "false" ? true : false);
                    });
                    dropdown.classList.remove("dropdownEVENT")
                })

                //preparing "account" section
                const accountPanel = document.querySelector("#account");
                const accountDropdownContainer = accountPanel.querySelector("#accountList")
                const loader = accountPanel.querySelector(".loader");

                const RefreshAccountList = () => {
                    loader.style.display = "";
                    console.log(prefix + "Refreshing account list");
                    const user = this.Authenticator.getLoggedAccount();
                    accountPanel.querySelector(".content .userName").innerText = user.username;
                    accountPanel.querySelector(".content .userImage").src = "https://mc-heads.net/avatar/" + user.username;
                    const accountList = this.Authenticator.getAccountList();
                    const loggedAccountId = this.Authenticator.getLoggedAccountId();
                    accountDropdownContainer.innerHTML = "";
                    for (let i = 0; i < accountList.length; i++) {
                        const newAccountCard = document.createElement("div");
                        newAccountCard.className = "account";

                        const userData = document.createElement("div");
                        userData.className = "userData";

                        if (i == loggedAccountId) {
                            newAccountCard.classList.add("logged");
                            newAccountCard.style.order = -1;
                            newAccountCard.addEventListener("click", () => {
                                //invert the state to let the accountPanel open
                                accountPanel.dataset.open = (accountPanel.dataset.open == "false" ? true : false);
                            })
                        } else {
                            userData.addEventListener("click", () => {
                                //invert the state to let the accountPanel open
                                accountPanel.dataset.open = (accountPanel.dataset.open == "false" ? true : false);
                                loader.style.display = "";
                                this.Authenticator.SwitchToAccount(i).then(() => {
                                    RefreshAccountList()
                                    loader.style.display = "none";
                                }).catch((err) => {
                                    //if err == undefined, user closed popup
                                    RefreshAccountList()
                                    loader.style.display = "none";
                                })
                            })
                        }
                        const userImage = document.createElement("img");
                        userImage.className = "userImage";
                        userImage.src = "https://mc-heads.net/avatar/" + accountList[i].username;
                        userData.appendChild(userImage);
                        const userName = document.createElement("div");
                        userName.className = "userName";
                        userName.innerText = accountList[i].username;
                        userData.appendChild(userName);
                        newAccountCard.appendChild(userData);
                        if (i != loggedAccountId) {
                            const btnLogout = document.createElement("div");
                            btnLogout.className = "button-logout";
                            btnLogout.addEventListener("click", () => {
                                //invert the state to let the accountPanel open
                                accountPanel.dataset.open = (accountPanel.dataset.open == "false" ? true : false);
                                this.Authenticator.RemoveAccount(i);
                                RefreshAccountList();
                            })
                            const btnLogoutImg = document.createElement("div");
                            btnLogoutImg.className = "img";
                            btnLogout.appendChild(btnLogoutImg);
                            newAccountCard.appendChild(btnLogout);
                        }
                        accountDropdownContainer.appendChild(newAccountCard);
                    }
                    //add the "add account" card
                    const addAccountCard = document.createElement("div");
                    addAccountCard.className = "addAccount";
                    addAccountCard.addEventListener("click", () => {
                        //invert the state to let the accountPanel open
                        accountPanel.dataset.open = (accountPanel.dataset.open == "false" ? true : false);
                        addAccountCard.querySelector(".img").style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)"
                        this.WaitLogin().then((loggedAccount) => {
                            addAccountCard.querySelector(".img").style.backgroundImage = ""
                            RefreshAccountList();
                        })
                    })
                    const addAccountCardImg = document.createElement("div");
                    addAccountCardImg.className = "img";
                    addAccountCard.appendChild(addAccountCardImg)
                    accountDropdownContainer.appendChild(addAccountCard);

                    loader.style.display = "none";
                }
                RefreshAccountList();



                //done
                resolve()
            } else {
                console.error(prefix + "Cannot setUp, user no logged");
                reject()
            }
        })

    }
    SwitchToTab(tabData) {
        this.containerTabSystem.switch(tabData[1].name)
        if (tabData[1].type == "version") {
            this.SwitchToVersion( /*this.getInterfaceData().selectedVersion*/ "1.19.2")
        }
    }
    SwitchToVersion(version) {
        console.log("switching to version " + version);
    }
    saveInterface() {
        this.UserFileManager.set("interface", {
            tab: this.selectedTab
        })
    }
    getInterfaceData() {
        const interfaceData = this.UserFileManager.get("interface");
        return interfaceData != undefined ? interfaceData : {
            //default interface data
            tab: TabList.VANILLA.name

        }
    }
}

function Start() {
    const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
    const { Authenticator, authProviderType } = require('./modules/authenticator');
    const { WaitLogin } = require('./modules/authPanel/authPanel');
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
                            const notificationId = notificationsManager.CreateNotification(NotificationsType.Info, "Please re-authenticate your account: <strong>" + account.account.username + "</strong>");
                            Authenticator.validateAccount(account.id).then(() => {
                                notificationsManager.close(notificationId);
                                resolve(true)
                            }).catch((err) => {
                                if (err.code == -1) {
                                    //popup was closed by user
                                    //user don't want to reauthenticate his account
                                    loader.style.display = "";
                                    document.querySelector("#MAIN").style.display = "";
                                    WaitLogin().then((loggedAccount) => {
                                        //Authenticator.login() must be called before to set the vars
                                        const account = {
                                            id: Authenticator.getLastLoggedAccountId(),
                                            account: Authenticator.getAccount(Authenticator.getLastLoggedAccountId())
                                        }
                                        loader.style.display = "";
                                        resolve(account)
                                    }).catch((reason) => {
                                        console.error(prefix + processPrefix + "Cannot return login because: " + reason.message);
                                    })
                                } else {
                                    console.error(err);
                                    resolve(false);
                                }
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
                            resolve(account);
                        }).catch((err) => {
                            notificationsManager.CreateNotification(NotificationsType.Error, "Cannot login: " + err)
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
                loader.style.display = "none";
                document.querySelector("#MAIN").style.display = "";
                WaitLogin().then((loggedAccount) => {
                    //Authenticator.login() must be called before to set the vars
                    const account = {
                        id: Authenticator.getLastLoggedAccountId(),
                        account: Authenticator.getAccount(Authenticator.getLastLoggedAccountId())
                    }
                    loader.style.display = "";
                    resolve(account)
                }).catch((reason) => {
                    console.error(prefix + processPrefix + "Cannot return login because: " + reason.message);
                })
            }
        })
    }

    console.log(prefix + "Starting...");
    console.log(prefix + "Initializing...");
    Setup().then(() => {
            console.log(prefix + "Login in...");
            Login().then((account) => {
                notificationsManager.CreateNotification(NotificationsType.Info, "Welcome <strong>" + account.account.username + "</strong>", 5000)

                console.log(prefix + "Preparing Interface...");
                const interface = new INTERFACE();
                interface.setUp().then(() => {
                    console.log(prefix + "Loaded Successfully");
                    //ALL DONE
                    document.querySelector("#MAIN").style.display = "";
                    setTimeout(() => {
                        loader.style.display = "none";

                    }, 2000);
                }).catch((err) => {
                    console.error("Cannot Load interface: " + err);
                })



            }).catch((err) => {
                console.error(prefix + "Cannot load:");
                console.error(err);
            })
        }).catch((err) => {
            console.error(prefix + "Cannot load:");
            console.error(err);
        })
        /**/

}




module.exports = { preLoad, Start }