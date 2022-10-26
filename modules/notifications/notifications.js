const NT = {
    Info: "info",
    Error: "error",
    Warning: "warning",
    Done: "done"
};
const NotificationsType = Object.freeze(NT);

class NotificationsManager {
    constructor(container) {
        this.prefix = "[Notification Module]: ";
        console.log(this.prefix + "Loading...");
        //load
        this.container = container;
        this.container.style.setProperty("--ymargin", "10vh");
        this.NotificationsList = [];

        console.log(this.prefix + "Loaded !");
    }
    CreateNotification(type, text, delay) {
        if (Object.values(NotificationsType).includes(type)) {
            const id = 0;
            //create
            const newNotification = document.createElement("div");
            newNotification.dataset.type = type;
            newNotification.dataset.id = id;
            newNotification.dataset.state = "hide";
            newNotification.className = "notifications";
            newNotification.style.setProperty("--id", 0);
            //color bar
            const bar = document.createElement("div");
            bar.className = "color";
            newNotification.appendChild(bar);
            //icon
            const icon = document.createElement("div");
            icon.className = "icon";
            newNotification.appendChild(icon);
            //contents
            const content = document.createElement("p");
            content.innerText = text;
            newNotification.appendChild(content);
            //cross
            const cross = document.createElement("div");
            cross.className = "cross";
            cross.addEventListener("click", () => {
                this.close(newNotification.dataset.id);
            })
            newNotification.appendChild(cross);
            //Object
            const newNotificationSave = {
                id: id,
                content: text,
                object: newNotification
            };
            //push other
            for (let i = 0; i < this.NotificationsList.length; i++) {
                const n = this.NotificationsList[i];
                n.object.style.setProperty("--id", i + 1);
                n.object.dataset.id = i + 1;

            }
            this.NotificationsList = [newNotificationSave, ...this.NotificationsList];
            //display
            this.container.appendChild(newNotification);
            newNotification.dataset.state = "show";
            if (delay) {
                setTimeout(() => {
                    this.close(newNotification.dataset.id);
                }, (delay));
            }


        } else {
            console.error(this.prefix + "Type is not valid: " + type);
        }
    }

    close(id) {
        const n = this.NotificationsList[id].object;
        n.dataset.state = "closing";
        //reindex
        for (let i = 0; i < this.NotificationsList.length; i++) {
            if (i > id) {
                const p = this.NotificationsList[i].object;
                p.style.setProperty("--id", i - 1);
                p.dataset.id = i - 1;
            }

        }
        this.NotificationsList.splice(
            this.NotificationsList.indexOf(this.NotificationsList[id]), 1
        );
        setTimeout(() => {
            n.dataset.state = "hide";
            n.remove();
        }, 1000);
    }

    closeAll() {
        for (let i = 0; i < this.NotificationsList.length; i++) {
            this.NotificationsList[i].object.dataset.state = "closing";
        }
        setTimeout(() => {
            for (let i = 0; i < this.NotificationsList.length; i++) {
                this.NotificationsList[i].object.remove();
            }
            this.NotificationsList = [];
        }, 1000);

    }
}

const notificationsManager = new NotificationsManager(document.getElementById('notification-container'));

module.exports = { notificationsManager, NotificationsType };