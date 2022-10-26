const { fastLaunch, validate, errorCheck } = require("msmc");
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
class Auth {
    constructor() {}
    LogIn(provider, user) {
        return new Promise((resolve, reject) => {
            if (provider != null) {
                switch (provider) {
                    case "Microsoft":
                        fastLaunch("raw", (update) => { console.log(update) })
                            .then(result => {
                                //If the login works
                                if (errorCheck(result)) {
                                    console.log("We failed to log someone in because : " + result.reason)
                                    return;
                                }
                                logginSaveManager.set("loggedUser", result);
                                setInterfaceInfos(result);
                                resolve(result);
                            })
                            .catch(reason => {
                                //If the login fails
                                console.error("We failed to log someone in because : " + reason);
                                reject(reason);
                            })
                        break;
                    case "internal":
                        if (user != null) {
                            if (this.isAccountValid(user)) {
                                //logged
                                //If the login works
                                if (errorCheck(user)) {
                                    console.log("We failed to log someone in because : " + result.reason)
                                    return;
                                }
                                logginSaveManager.set("loggedUser", user);
                                setInterfaceInfos(user);
                                resolve(user);
                            } else {
                                console.error("user not valid");
                                reject();
                            }
                        } else {
                            error("please give a user [Internal Login] !");
                            reject();
                        }
                        break;
                    default:
                        console.error("ProviderMethod needed !");
                        reject();
                        break;
                }
            }
        })



    }
    isAccountValid(user) {
        if (user != null) {
            return (validate(user.profile));
        } else {
            console.error("user to verifie is null");
        }

    }
    isLogged() {
        if (logginSaveManager.get("loggedUser") != null) {
            return this.isAccountValid(logginSaveManager.get("loggedUser"))
        } else {
            return false;
        }


    }
    getLoggedAccount() {
        if (this.isLogged()) {
            return logginSaveManager.get("loggedUser");
        } else {
            console.error("no one is logged");
        }
    }
    logOut() {
        logginSaveManager.set("loggedUser", null);
        document.querySelector("#authPanel").style.display = null;
        resetInterface();
        notificationsManager.CreateNotification(NotificationsType.Done, "Logged out", 5000);
    }

}
const auth = new Auth();
const accountPannel = document.querySelector("#account");
const accountImage = accountPannel.querySelector("#userImage");
const accountPseudo = accountPannel.querySelector(".username");

function setInterfaceInfos(user) {
    if (auth.isAccountValid(user)) {
        console.log("setting interface info");
        accountImage.src = "https://mc-heads.net/avatar/" + user.profile.name;
        accountPseudo.innerText = user.profile.name;
        //dropper
        if (accountPannel.dataset.e == "false") {
            accountPannel.addEventListener("click", () => {
                if (accountPannel.dataset.open == "false") {
                    accountPannel.dataset.open = "true";
                } else {
                    accountPannel.dataset.open = "false";
                }
            })
            accountPannel.dataset.e = "true";
        }
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

module.exports = { Auth }