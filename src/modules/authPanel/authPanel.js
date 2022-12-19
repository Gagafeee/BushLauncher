const prefix = "[AuthPanel]: ";
const $ = require('jquery');
const { Authenticator, authProviderType } = require('../authenticator');
class AuthPanel {
    constructor(container, callback) {
        this.callback = callback;
        this.mainContainer = container;
        if (this.mainContainer == undefined) {
            console.error(prefix + "Cannot Init: Cannot find " + container + " div container");
        } else {
            //load the html file as container
            $(this.mainContainer).load("./modules/authPanel/panel.html", () => {
                const MSButton = this.mainContainer.querySelector("#LoginMS");
                MSButton.addEventListener("click", () => {
                    MSButton.querySelector(".img").style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)";
                    this.Login(authProviderType.MICROSOFT).then(() => {
                            MSButton.querySelector(".img").style.backgroundImage = "";
                        })
                        .catch((err) => {
                            MSButton.querySelector(".img").style.backgroundImage = "url(./ressources/graphics/icons/close.svg)";
                            console.error("Cannot return login error:")
                            console.error(err);
                            setTimeout(() => {
                                MSButton.querySelector(".img").style.backgroundImage = "";
                            }, 4000);
                        })
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
        return new Promise((resolve, reject) => {
            Authenticator.AddAccount(authProviderType).then((loggedAccount) => {
                this.callback(loggedAccount);
                resolve()
            }).catch((error) => {
                reject(error);
            })
        })

    }

}
//const MainAuthPanel = new AuthPanel(document.querySelector("#auth-panel-container"));

function WaitLogin() {
    return new Promise((resolve, reject) => {
        const CallbackAuthPanel = new AuthPanel(document.querySelector("#auth-panel-container"), (loggedAccount) => {
            /*resolved account is already logged, added and selected*/
            loggedAccount == undefined ? reject("closed by user") : resolve(loggedAccount);
            CallbackAuthPanel.Close();
            CallbackAuthPanel.Destroy();
        })
        CallbackAuthPanel.Show();
        //TODO: If user close the frame reject
    })
}
module.exports = { /*MainAuthPanel,*/ WaitLogin };