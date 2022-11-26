var initialized = false;
const prefix = "[AuthPanel]: ";

function InitAuthPanel(authenticator) {
    if (!initialized) {
        console.log("initializing auth panel");
        /*login buttons*/
        Array.from(document.getElementsByClassName("btn-log-microsoft")).forEach((e) => {
            e.addEventListener("click", () => {
                e.firstElementChild.style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)";
                authenticator.LogIn("Microsoft")
                    .then(() => {
                        document.querySelector('#authPanel').style.display = "none";
                        e.firstElementChild.style.backgroundImage = null;
                    })
                    .catch((error) => {
                        console.error(prefix + "cannot Login: " + error);
                        e.firstElementChild.style.backgroundImage = null;
                    })
            })
        });

        /*logout buttons*/
        Array.from(document.getElementsByClassName("btn-logout")).forEach((e) => {
            e.addEventListener("click", () => {
                e.querySelector(".img").style.backgroundImage = "url(./ressources/graphics/icons/loading.svg)";
                authenticator.logOut();
                e.querySelector(".img").style.backgroundImage = null;
            })
        });
        initialized = true;
        console.log(prefix + "initialized");
        showAuthPanel();
    } else {
        console.warn("auth panel already initialized");
    }

}

function hideAuthPanel() {
    /*if(!initialized) InitAuthPanel(); need autenticator*/
    document.querySelector("#authPanel").style.display = "none";
}
function showAuthPanel() {
    /*if(!initialized) InitAuthPanel(); need authenticator*/
    document.querySelector("#authPanel").style.display = "";
}

module.exports = { InitAuthPanel, hideAuthPanel, showAuthPanel }