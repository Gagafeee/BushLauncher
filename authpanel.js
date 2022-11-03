var initialized = false;

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
        showAuthPanel()
        initialized = true;
    } else {
        console.warn("auth panel already initialized");
    }

}

function hideAuthPanel() {
    document.querySelector("#authPanel").style.display = "";
}
function showAuthPanel() {
    document.querySelector("#authPanel").style.display = "";
}

module.exports = { InitAuthPanel, hideAuthPanel }