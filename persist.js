class Service {
    constructor(store) {
        this.store = store
        this.dbPromise = idb.open('app', 1, upgradeDB => {
            upgradeDB.createObjectStore(this.store, {keyPath: "id"});
        });
    }

    async write(data) {
        let db = await this.dbPromise;
        const tx = db.transaction(this.store, 'readwrite');
        tx.objectStore(objectStore).put(data);
        return tx.complete;
    }
}


class TodoListService extends Service {

    constructor(store) {
        super(store);
    }

    async function saveTodoList(todoList) {
        let db = await todoListDBPromise;
        write(db, "todo-lists", todoList)
    }


    getAllTodoListNames() {
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
}

function write(db, objectStore, val) {
    const tx = db.transaction(objectStore, 'readwrite');
    tx.objectStore(objectStore).put(val);
    return tx.complete;
}
