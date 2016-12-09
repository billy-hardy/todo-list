const todoListDBPromise = idb.open('app', 1, upgradeDB => {
    upgradeDB.createObjectStore('todo-lists', {keyPath: "id"});
    upgradeDB.createObjectStore('todo-items', {keyPath: "id"});
});

class TodoListService {
    constructor() {

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
