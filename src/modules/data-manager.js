const path = require('path');
const fs = require('fs');
//this is the base class
class FileManager {
    constructor(opts) {
            this.filePath = path.join("", opts.fileName + '.json');
            this.data = parseDataFile(this.filePath, (opts.defaults ? opts.default : {}));
        }
        // This will just return the property on the `data` object
    get(key) {
            return this.data[key];
        }
        // ...and this will set it
    set(key, val) {
        this.data[key] = val;
        // Wait, I thought using the node.js' synchronous APIs was bad form?
        // We're not writing a server so there's not nearly the same IO demand on the process
        // Also if we used an async API and our app was quit before the asynchronous write had a chance to complete,
        // we might lose that data. Note that in a real app, we would try/catch this.
        fs.writeFileSync(this.filePath, JSON.stringify(this.data));
    }
    add(key, val, pos) {
        let list = this.get(key);
        list = (typeof list === "object" ? list : [])
        console.log(list);
        let newList;
        if (typeof pos === undefined) {
            newList = [...list, val];
        }else{
            newList = list;
            newList.splice(pos, 0, val);
            console.log(newList);
        }
        
        
        this.set(key, newList);
    }
    remove(key, id) {
        let list = this.get(key);
        list = Array.from(typeof list === "object" ? list : [])
        list.splice(id, 1);
        this.set(key, list);
    }
    replace(key, val, pos){
        this.add(key, val, pos);
        this.remove(key, pos+1);
    }
}

function parseDataFile(filePath, defaults) {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    try {
        return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
        // if there was some kind of error, return the passed in defaults instead.
        return defaults;
    }
}

//add a new manager for each files
const AccountsFileManager = new FileManager({
    fileName: "AccountList"
})
module.exports = { AccountsFileManager }