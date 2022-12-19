const { notificationsManager, NotificationsType } = require('./notifications/notifications');
const prefix = "[Authenticator]: ";
const DateModule = new Date;
const { fastLaunch, validate, errorCheck } = require("msmc");
const { AccountsFileManager } = require("./data-manager");
const authProviderType = {
    MICROSOFT: "MICROSOFT",
    RAW: "RAW"
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
                            if (logginResult == undefined) {
                                reject(undefined)
                                return
                            }
                            if (errorCheck(logginResult)) {
                                notificationsManager.CreateNotification(NotificationsType.Error, "Cannot log in your account", 2000)
                                console.error(prefix + "We failed to log someone in (probably: popup closed by user)")
                                reject()
                                return
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
                            if (err != undefined) { console.error(err); }
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
        return new Promise((resolve, reject) => {
            const account = this.getAccount(id);
            if (account != undefined) {
                const Validate = () => {
                    return new Promise((resolve, reject) => {
                        if (this.isAccountValid(account)) {
                            resolve()
                        } else {
                            console.error(prefix + "Account is not valid must be relogged...");
                            const ntID = notificationsManager.CreateNotification(NotificationsType.Info, "Please re-login your account <strong>" + this.getAccount(id).username + "</strong>, it's not valid anymore")
                            this.validateAccount(id).then((reloggedAccount) => {
                                notificationsManager.close(ntID);
                                resolve(reloggedAccount);
                            }).catch((err) => {
                                if (err != undefined) {
                                    notificationsManager.CreateNotification(NotificationsType.Error, "Cannot re-login your account: " + err)
                                    console.error(err);
                                }
                                notificationsManager.close(ntID);
                                reject(err);

                            })
                        }
                    })

                }
                Validate().then(() => {
                    if (this.getLoggedAccountId != id) {
                        console.log(prefix + "switching to the " + id + "th account of list: " + account.data.profile.name);
                        this.fileManager.set("logged-account", {
                            listId: id
                        });
                        this.Login(authProviderType.RAW, this.getAccountList()[id])
                        notificationsManager.CreateNotification(NotificationsType.Done, "Logged as <strong>" + account.username + "</strong>", 2000 )
                        resolve()
                    } else {
                        console.error("Cannot switch: Account is already in use");
                        reject()
                    }
                }).catch((err) => {
                    if (err != undefined) { console.error(err); }
                    reject(err);
                })

            } else {
                console.error("Cannot switch: Account " + id + " don't exist in list");
                reject()
            }

        })


    }
    RemoveAccount(id) {
        console.log(prefix + "Removing Account: " + id);
        this.fileManager.remove("account-list", id)
    }
    RemoveAll() {
        this.fileManager.set("account-list", [])
    }
    getAccountList() {
        const list = this.fileManager.get("account-list");
        return (typeof list === "object" ? Array.from(list) : null)
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
    getAuthProvider(account) {
        return account.authProviderType;
    }
    isAccountLogged() {
        return this.loggedAccount != null;
    }
    isAccountValid(account) {
        return validate(account.data.profile)
    }
    isAccountList() {
        return this.getAccountList() != null;
    }
    validateAccount(id, authProvider) {
        return new Promise((resolve, reject) => {
            if (authProvider == undefined) {
                authProvider = this.getAuthProvider(this.getAccount(id));
            }
            switch (authProvider) {
                case authProviderType.MICROSOFT:
                    {
                        this.Login(authProviderType.MICROSOFT).then((loggedAccount) => {
                            this.fileManager.replace("account-list", loggedAccount, id);
                            resolve()
                        }).catch((error) => {
                            reject(error);
                        })
                        break;
                    }
                default:
                    {
                        console.error(prefix + authProvider + " authProvider is not implemented")
                        reject();
                        break;
                    }
            }

        })
    }



}

const Authenticator = new AuthenticatorManager();

module.exports = { Authenticator, authProviderType };