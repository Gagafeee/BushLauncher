const { fastLaunch, validate, errorCheck } = require("msmc");
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});

const { notificationsManager, NotificationsType } = require('./modules/notifications/notifications');
const prefix = "[Authenticator]: ";


function LogIn(provider, user) {
    const interface = require("./interface");
    return new Promise((resolve, reject) => {
        if (provider != null) {
            switch (provider) {
                case "Microsoft":
                    fastLaunch("raw", (update) => { console.log(update) })
                        .then(result => {
                            //If the login works
                            if (errorCheck(result)) {
                                console.log(prefix + "We failed to log someone in because : " + result.reason)
                                return;
                            }
                            logginSaveManager.set("loggedUser", result);
                            interface.setInterfaceInfos(result);
                            resolve(result);
                        })
                        .catch(reason => {
                            //If the login fails
                            console.error(prefix + "We failed to log someone in because : " + reason);
                            reject(reason);
                        })
                    break;
                case "internal":
                    if (user != null) {
                        if (isAccountValid(user)) {
                            //logged
                            //If the login works
                            if (errorCheck(user)) {
                                console.log(prefix + "We failed to log someone in because : " + result.reason)
                                return;
                            }
                            logginSaveManager.set("loggedUser", user);
                            interface.setInterfaceInfos(user);
                            resolve(user);
                        } else {
                            console.error(prefix + "user not valid");
                            reject();
                        }
                    } else {
                        error("please give a user [Internal Login] !");
                        reject();
                    }
                    break;
                default:
                    console.error(prefix + "ProviderMethod needed !");
                    reject();
                    break;
            }
        }
    })



}

function isAccountValid(user) {
    if (user != null) {
        return (validate(user.profile));
    } else {
        console.error(prefix + "user to verifie is null");
    }

}

function isLogged() {
    if (logginSaveManager.get("loggedUser") != null) {
        return isAccountValid(logginSaveManager.get("loggedUser"))
    } else {
        return false;
    }


}

function getLoggedAccount() {
    if (isLogged()) {
        return logginSaveManager.get("loggedUser");
    } else {
        console.error(prefix + "no one is logged");
    }
}

function logOut() {
    const interface = require("./interface");
    logginSaveManager.set("loggedUser", null);
    document.querySelector("#authPanel").style.display = null;
    interface.resetInterface();
    notificationsManager.CreateNotification(NotificationsType.Done, "Logged out", 5000);
}

function getData(user) {
    if (isAccountValid(user)) {
        return user.data;
    } else {
        error("account is not valid");
    }
}



module.exports = { LogIn, logOut, getData, getLoggedAccount, isLogged, isAccountValid }