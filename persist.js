importScripts('/node_modules/idb/lib/idb.js');

const todoListDBPromise = idb.open('app', 1, upgradeDB => {
    upgradeDB.createObjectStore('todo-lists', {keyPath: "id"});
    upgradeDB.createObjectStore('todo-items', {keyPath: "id"});
});

self.addEventListener("message", async function({data}) {
    let cmd = data.cmd;
    let objectType = data.objectType;
    if(cmd == "create") {
        if(data.objectType == "todoList") {
            let success = await saveTodoList(data.value);
            self.postMessage({cmd, objectType});
        }
    } else if(cmd == "retrieve") {
        let valToGet = data.value
        if(valToGet == null) {
            let keys = await getKeys();
            self.postMessage({cmd, keys});
        } else {
            let value = await getVal(data.value);
            self.postMessage({cmd, value});
        }
    } else if(cmd == "retrieveAll") {
        let values = await getAllTodoLists();
        self.postMessage({cmd, values});
    }
});

async function saveTodoList(todoList) {
    let db = await todoListDBPromise;
    write(db, "todo-lists", todoList)
}

function write(db, objectStore, val) {
    const tx = db.transaction(objectStore, 'readwrite');
    tx.objectStore(objectStore).put(val);
    return tx.complete;
}

function getAllTodoListNames() {
    return idbKeyval.keys();
}

async function getAllTodoLists() {
    let names = await getAllTodoListNames();
    let values = await Promise.all(names.map(function(name) {
        return getTodoList(name);
    }));
    return values;
}

async function getTodoList(name) {
    return await idbKeyval.get(name);
}
