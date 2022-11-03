function setWindowProgressbar(percent, type) {
    ipcRenderer.send("set-progress-bar", { p: percent, type: type ? type : "normal" });
}
const loadPanel = document.querySelector("#loading-panel");

function INIT() {
    Array.from(document.querySelector("#app").children).forEach((e) => {
        e.style.opacity = 0;
    });

    setTimeout(() => {
        loadPanel.firstElementChild.classList.remove("pop");
    }, 1000);
    const { ipcRenderer } = require("electron");
    const authenticator = require('./authenticator');
    const authPanel = require('./authpanel');
    const { DataManager } = require("./modules/data-manager.js");
    const logginSaveManager = new DataManager({
        configName: 'logged-users',
        defaults: {}
    });
    const prefix = "[Loader]: ";
    //LOAD
    //

    /*replace all version textes */
    ipcRenderer.invoke("getVersion").then((version) => {
            Array.from(document.querySelectorAll(".app-version")).forEach((e) => {
                e.innerText = version;
            })
        })
        //
        /*menu */
    document.querySelector("#menu-bar").addEventListener("dblclick", () => {
        ipcRenderer.invoke("isWindowMaximized").then((isMaximized) => {
            ipcRenderer.postMessage(isMaximized ? "unmaximize-window" : "maximize-window");
        })
    })
    document.querySelector("#close-btn").addEventListener("click", () => {
        ipcRenderer.postMessage("close-app");
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

    /*reauth user (if is posible) */
    if (authenticator.isLogged()) {
        console.log(prefix + "detecting save, trying to login...");
        if (authenticator.isAccountValid(logginSaveManager.get("loggedUser"))) {
            //the accont is valid, we can use it to launch
            console.log(prefix + "Is valid: using: " + logginSaveManager.get("loggedUser").profile.name);
            console.log("not interface");
            authenticator.LogIn("internal", logginSaveManager.get("loggedUser"));
        } else {
            console.warn(prefix + "save is no valid");
            authPanel.InitAuthPanel(authenticator);
        }
    } else {
        console.log(prefix + "no user login save");
        authPanel.InitAuthPanel(authenticator);
    }
    //done
    setTimeout(() => {
        Array.from(document.querySelector("#app").children).forEach((e) => {
            e.style.opacity = null;
        })
        loadPanel.dataset.show = false;
        document.querySelector("body").dataset.loaded = true;
        console.log("show all");

    }, 2000);


}

module.exports = { setWindowProgressbar, INIT }