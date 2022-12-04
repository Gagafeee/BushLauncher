const { notificationsManager, NotificationsType } = require('./notifications/notifications');
const prefix = "[Authenticator]: ";
const DateModule = new Date;
const { fastLaunch, validate, errorCheck } = require("msmc");
const { AccountsFileManager } = require("./data-manager");
const authProviderType = {
    MICROSOFT: "MICROSOFT",
    RAW: "RAW"
}
class account {
    constructor(name, provider, data) {
        this.username = name,
            this.loggedDate = DateModule.getTime(),
            this.loggedProvider = provider,
            this.data = data;
    }

}
class AuthenticatorManager {
    constructor() {
        this.fileManager = AccountsFileManager;
        this.accountList = this.getAccountList();
        this.loggedAccount = null;
    }

    Login(authProviderType, data) {
        return new Promise((resolve, reject) => {
            switch (authProviderType) {
                case "MICROSOFT":
                    {
                        console.log(prefix + "Login from Microsoft API");
                        fastLaunch("raw", (logginUpdate) => { console.log(logginUpdate); })
                        .then((logginResult) => {
                            if (errorCheck(logginResult)) {
                                console.error(prefix + "We failed to log someone in because : " + result.reason)
                                return;
                            }
                            //loggin success
                            const newAccount = {
                                username: logginResult.profile.name,
                                loggedDate: DateModule.getTime(),
                                authProviderType: authProviderType,
                                data: logginResult
                            }

                            this.loggedAccount = newAccount;
                            console.log(this.loggedAccount);

                            resolve(newAccount);
                        }).catch((err) => {
                            reject(err)
                        })
                        break;
                    }
                case "RAW":
                    {
                        console.log(prefix + "Login from local Data");
                        this.loggedAccount = data;
                        resolve(data);
                        break;
                    }


                    //case ""
            }
        })
    }
    AddAccount(authProviderType) {
        return new Promise((resolve, reject) => {
            console.log(prefix + "adding a new Account...");
            this.Login(authProviderType).then((loggedAccount) => {
                //add it to the list
                this.fileManager.add("account-list", loggedAccount);
                this.SwitchToAccount(this.getLoggedAccountId())
                resolve(loggedAccount);
            }).catch((error) => {
                reject(error);
            })
        })

    }
    SwitchToAccount(id) {
        const account = this.getAccount(id);
        if (account != undefined) {
            if (this.isAccountValid(account)) {
                console.log(prefix + "switching to the " + id + "th account of list: " + account.data.profile.name);
                this.fileManager.set("logged-account", {
                    listId: id
                });
            } else {
                console.error("Cannot switch: Account is not valid");
            }
        } else {
            console.error("Cannot switch: Account " + id + " don't exist in list");
        }


    }
    RemoveAccount(id) {
        this.fileManager.remove("account-list", id)
    }
    RemoveAll() {
        this.fileManager.set("account-list", [])
    }
    getAccountList() {
        const list = this.fileManager.get("account-list");
        return (typeof list === "object" ? Array.from(list) : [])
    }
    getAccount(id) {
        return this.getAccountList()[id];
    }
    getLoggedAccount() {
        if (this.isAccountLogged) {
            return this.loggedAccount
        } else {
            console.error(prefix + "Cannot return the logged account because no one is logged");
        }
    }
    getLoggedAccountId() {
        if (this.isAccountLogged()) {
            return this.getAccountList().indexOf(this.getLoggedAccount())
        } else {
            console.error(prefix + "Cannot return the logged account id because no one is logged");
        }
    }
    getLastLoggedAccountId() {
        const res = this.fileManager.get("logged-account");
        const id = res != undefined ? res.listId != undefined ? res.listId : 0 : 0;
        return id;
    }
    isAccountLogged() {
        return this.loggedAccount != null;
    }
    isAccountValid(account) {
        return validate(account.data.profile)
    }
    isAccountList() {
        return this.getAccountList() != [];
    }
    validateMSAccount(id) {
        return new Promise((resolve, reject) => {
            this.Login(authProviderType.MICROSOFT).then((loggedAccount) => {
                this.fileManager.replace("account-list", loggedAccount, id);
                resolve()
            }).catch((error) => {
                reject(error);
            })
        })


    }



}

const Authenticator = new AuthenticatorManager();

module.exports = { Authenticator, authProviderType };