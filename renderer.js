Array.from(document.querySelector("#app").children).forEach((e) => {
    e.style.opacity = 0;
})
setTimeout(() => {
    loadPanel.firstElementChild.classList.remove("pop");
}, 1000);


const { ipcRenderer } = require("electron");
const loadPanel = document.querySelector("#loading-panel");
const { Auth } = require('./authenticator');
const auth = new Auth();
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
const { StartGame, ClientType, ClientVersion } = require("./launcher");
const prefix = "[Loader]: ";


window.addEventListener("DOMContentLoaded", () => {
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
                    icon.classList.remove("fa-square");
                    icon.classList.add("fa-clone");
                } else {
                    icon.classList.add("fa-square");
                    icon.classList.remove("fa-clone");
                }
            })


        })
        /*login buttons*/
    Array.from(document.getElementsByClassName("btn-log-microsoft")).forEach((e) => {
            e.addEventListener("click", () => {
                e.firstElementChild.style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)";
                auth.LogIn("Microsoft")
                    .then(() => {
                        document.querySelector('#authPanel').style.display = "none";
                        e.firstElementChild.style.backgroundImage = null;
                    })
                    .catch((error) => {
                        console.error(prefix + "cannot Login: " + error);
                        e.firstElementChild.style.backgroundImage = null;
                    })
            })
        })
        //logout buttons
    Array.from(document.getElementsByClassName("btn-logout")).forEach((e) => {
            e.addEventListener("click", () => {
                e.querySelector(".img").style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)";
                auth.logOut();
                e.querySelector(".img").style.backgroundImage = null;
            })
        })
        /*reauth user (if is posible) */
    if (auth.isLogged()) {
        console.log(prefix + "detecting save, trying to login...");
        if (auth.isAccountValid(logginSaveManager.get("loggedUser"))) {
            //the accont is valid, we can use it to launch
            console.log(prefix + "Is valid: using: " + logginSaveManager.get("loggedUser").profile.name);
            auth.LogIn("internal", logginSaveManager.get("loggedUser"));
            //hide login panel
            document.querySelector('#authPanel').style.display = 'none';
        } else {
            console.warn(prefix + "save is no valid");
        }
    } else {
        console.log(prefix + "no user login save");
    }
    //
    setTimeout(() => {

        Array.from(document.querySelector("#app").children).forEach((e) => {
            e.style.opacity = null;
        })
        loadPanel.dataset.show = false;
    }, 2000);

})