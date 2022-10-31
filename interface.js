const { Auth } = require('./authenticator');
const auth = new Auth();
const { ClientType, ClientVersion, StartGame, getVanillaVersionList, locationRoot } = require('./launcher');
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
const localDataManager = new DataManager({
    configName: 'localData',
    default: {}
});
const { getServerList, refreshServerList } = require('./servers');
const fs = require('fs');
const prefix = "[Interface]: ";

var inited = false;
var selectedVersionType = null;
var selectedVersion = null;
const versionTypeSelectorMenu = document.querySelector("#side-menu")
const versionTypeSelectorMenuButtons = versionTypeSelectorMenu.querySelectorAll(".version-type");
const MainContainer = document.querySelector('#MainContainer');
const containers = MainContainer.querySelectorAll(".container");
const accountPannel = document.querySelector("#account");
const accountImage = accountPannel.querySelector("#userImage");
const accountPseudo = accountPannel.querySelector(".username");



function InitInterface() {
    if (!inited) {
        /*Account */

        //dropper
        accountPannel.addEventListener("click", () => {
            if (accountPannel.dataset.open == "false") {
                accountPannel.dataset.open = "true";
            } else {
                accountPannel.dataset.open = "false";
            }
        });
        /*SideMenu*/
        const data = auth.getData(auth.getLoggedAccount());
        selectedVersionType = (data != undefined ? (data.selectedVersionType != undefined ? data.selectedVersionType : ClientType.VANILLA) : ClientType.VANILLA)
        selectedVersion = (data != undefined ? (data.selectedVersion != undefined ? data.selectedVersion : ClientVersion[1192]) : ClientVersion[1192])

        Array.from(versionTypeSelectorMenuButtons).forEach((c) => {
                c.addEventListener("click", () => {
                    ChangeVersionType(c.id);
                })
            })
            //launchbutton
        Array.from(containers).forEach((container) => {
            container.querySelector("#LaunchButton").querySelector(".launch").addEventListener("click", () => {
                const e = container.querySelector("#LaunchButton");
                if (e.dataset.launching == "false") {
                    container.querySelector("#LaunchButton").dataset.open = false;
                    StartGame(selectedVersionType, selectedVersion, (Update) => UpdateLaunchingState(Update, container.querySelector("#LaunchButton")));
                }
            })
            container.querySelector("#LaunchButton").querySelector(".version-selector").addEventListener("click", () => {
                const e = container.querySelector("#LaunchButton");
                if (e.dataset.launching == "false") {
                    if (e.dataset.open == "false") {
                        e.dataset.open = true;
                    } else {
                        e.dataset.open = false;
                    }
                }

            })
        })

        inited = true;
    }


}
var textCount = 0;

function UpdateLaunchingState(LaunchState, Button) {
    const text = Button.querySelector(".launch").querySelector("p");
    const bar = Button.querySelector(".loadBar");
    if (LaunchState.code == 0) {
        textCount = 0;
        text.innerText = "Launch";
        Button.dataset.launching = false;
        bar.style.setProperty("--loadpercentage", 0 + "%");
    } else {
        const y = textCount * (100 / 7)
        bar.style.setProperty("--loadpercentage", y + "%");
        console.log("[" + y + "%]: " + LaunchState.text);
        Button.dataset.launching = true;
        text.innerText = LaunchState.text;
        if (LaunchState.code == -1) {
            Button.dataset.launching = "launched"
        } else if (LaunchState.code != -1 && LaunchState.code != 0) {
            console.warn(LaunchState.code);
        }
        textCount++;
    }

}

function setInterfaceInfos(user) {
    if (auth.isAccountValid(user)) {
        console.log(prefix + "setting interface info");
        accountImage.src = "https://mc-heads.net/avatar/" + user.profile.name;
        accountPseudo.innerText = user.profile.name;
        InitInterface();
        ChangeVersionType(selectedVersionType);


        //done
        notificationsManager.CreateNotification(NotificationsType.Info, "Logged successful to: " + user.profile.name + ".", 7000)
    } else {
        console.error("Cannot set interface infos: account not valid");
    }
}

function resetInterface() {
    accountImage.src = "https://mc-heads.net/avatar/notch";
    accountPseudo.innerText = "undefined";
}

function ChangeVersionType(newVersionType) {
    if (Object.keys(ClientType).includes(newVersionType)) {
        console.log(prefix + "switching to: " + newVersionType);
        //set buttons
        Array.from(versionTypeSelectorMenuButtons).forEach((c) => {
                c.classList.remove("selected");
                if (c.id == newVersionType) {
                    c.classList.add("selected");
                }
            })
            //set containers
        var container = null;
        Array.from(containers).forEach((c) => {
            c.classList.remove("show");
            if (c.id == newVersionType + "-container") {
                c.classList.add("show");
                container = c;
            }
        })

        //save interface
        selectedVersionType = newVersionType;
        SaveInterface(auth.getLoggedAccount());
        //set button 
        var v = null;
        if (Object.values(ClientVersion[selectedVersionType]).includes(selectedVersion)) {
            v = selectedVersion;
        } else {
            v = Object.values(ClientVersion[selectedVersionType])[0];
            console.log(prefix + "Version " + selectedVersion + " is not available in " + selectedVersionType + " environment: switching to " + v);
        }
        ChangeVersion(v);
        getServerList().then((LocalServerList) => {
            refreshServerList(LocalServerList, selectedVersion);
        })
    } else {
        console.error("cannot change version type: version is not supported");
        console.error(newVersionType);
    }
}

function ChangeVersion(version) {
    if (Object.values(ClientVersion[selectedVersionType]).includes(version)) {
        console.log(prefix + 'switching to version: ' + version);
        var container = null;
        Array.from(containers).forEach((c) => {
            if (c.id == selectedVersionType + "-container") {
                container = c;
            }
        })
        const LaunchButton = container.querySelector("#LaunchButton");
        const LaunchButtonSelectedVersionText = LaunchButton.querySelector(".version-selector").querySelector(".version");
        const LaunchButtonVersionContainer = LaunchButton.querySelector(".version-selector").querySelector(".dropper");
        selectedVersion = version;
        //prepare button 
        LaunchButtonSelectedVersionText.innerHTML = selectedVersion;
        //dropper
        LaunchButtonVersionContainer.innerHTML = "";
        GetInstalledVersion(selectedVersionType).then((statList) => {
            for (let i = 0; i < Object.keys(ClientVersion[selectedVersionType]).length; i++) {
                const version = Object.values(ClientVersion[selectedVersionType])[i];
                const stat = statList.find((stat) => {
                    return stat.v == version;
                });
                //contruct
                const newVersion = document.createElement("div");
                newVersion.className = "version";
                if (version == selectedVersion) {
                    newVersion.classList.add("selected");
                }
                newVersion.addEventListener("click", () => {
                        ChangeVersion(Object.values(ClientVersion[selectedVersionType])[i]);
                    })
                    //icon
                const img = document.createElement("div");
                img.className = "img" + (stat.installed ? " installed" : " toDownload");
                newVersion.appendChild(img);
                //text
                const text = document.createElement("p");
                text.innerHTML = version;
                newVersion.appendChild(text);
                //add
                LaunchButtonVersionContainer.appendChild(newVersion);
                //Save
                SaveInterface(auth.getLoggedAccount());
            }
        })

    } else {
        console.error("cannot change version: version is not supported");
        console.error(version);
    }

}

function SaveInterface(user) {
    var u = user;
    if (u.data == null) {
        u.data = {};
    }
    u.data = {
        selectedVersionType: selectedVersionType,
        selectedVersion: selectedVersion
    };
    logginSaveManager.set("loggedUser", u)

}


function GetInstalledVersion(clientType) {
    return new Promise((resolve, reject) => {
        var VersionList = [];
        switch (clientType) {
            case ClientType.VANILLA:
                getVanillaVersionList().then((versionList) => {
                    const u = (locationRoot + "\\versions\\");
                    const folderList = fs.readdirSync(u);
                    for (let i = 0; i < versionList.length; i++) {
                        const e = versionList[i];
                        if (folderList.includes(e.id)) {
                            VersionList.push({ installed: true, v: e.id, version: e });

                        } else {
                            VersionList.push({ installed: false, v: e.id, version: e });
                        }


                    }
                    resolve(VersionList);

                })
                break;

            default:
                break;
        }

    })

}
module.exports = { resetInterface, setInterfaceInfos, InitInterface }