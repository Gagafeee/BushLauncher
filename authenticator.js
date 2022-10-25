const { fastLaunch, validate, errorCheck } = require("msmc");
const { DataManager } = require("./modules/data-manager.js");
const logginSaveManager = new DataManager({
    configName: 'logged-users',
    defaults: {}
});
class Auth {
    constructor() {}
    LogIn(provider) {
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
                                resolve(result);
                            })
                            .catch(reason => {
                                //If the login fails
                                console.error("We failed to log someone in because : " + reason);
                                reject(reason);
                            })
                        break;

                    default:
                        console.error("ProviderMethod needed !");
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
}

module.exports = { Auth }