const prefix = "[AuthPanel]: ";
const $ = require('jquery');
const { Authenticator, authProviderType } = require('../authenticator');
class AuthPanel {
    constructor(container, callback) {
        this.callback = callback;
        this.mainContainer = container;
        if (this.mainContainer == undefined) {
            console.error(prefix + "Cannot Init: Cannot find 'auth-panel-container' div container");
        } else {
            //load the html file as container
            $(this.mainContainer).load("./modules/authPanel/panel.html", () => {
                console.log(this.mainContainer);
                this.mainContainer.querySelector("#LoginMS").addEventListener("click", () => {
                    this.Login(authProviderType.MICROSOFT)
                })
            });

        }
    }
    Init() {
        console.log(prefix + "Initializing...");



        console.log(prefix + " Initialized successfully");
    }
    Show() {
        this.Init();
        console.log(prefix + "Showing up");
        this.mainContainer.dataset.show = true;
    }
    Close() {
        this.mainContainer.dataset.show = false;
        console.log(prefix + "Closed");
    }
    Destroy() {
        this.mainContainer.innerHTML = '';
    }
    Login(authProviderType) {
        Authenticator.AddAccount(authProviderType).then((loggedAccount) => {
            this.callback(loggedAccount);
        })
    }

}
//const MainAuthPanel = new AuthPanel(document.querySelector("#auth-panel-container"));

function WaitLogin() {
    return new Promise((resolve, reject) => {
        const CallbackAuthPanel = new AuthPanel(document.querySelector("#auth-panel-container"), (loggedAccount) => {
            resolve(loggedAccount);
            CallbackAuthPanel.Close();
            CallbackAuthPanel.Destroy();
        })
    })
}
module.exports = { /*MainAuthPanel,*/ WaitLogin };