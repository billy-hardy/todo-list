let persistWorker = new Worker("persist.js");

function saveTodo() {
    let input = document.getElementById("temp");

    let val = input.value;
    persistWorker.postMessage({cmd: "create", value: val});
}

function saveTodoList(todoList) {
    persistWorker.postMessage({cmd: "create", objectType: "todoList", value: todoList});
}

data.forEach(function(todoList) {
    saveTodoList(todoList);
});

function getAllTodos() {
    let display = document.getElementById("display");
    persistWorker.postMessage({cmd: "retrieveAll"});
}

persistWorker.addEventListener('message', function ({data}) {
    let display = document.getElementById("display");
    if(data.cmd == "create") {
        console.log("value saved");
    } else if(data.cmd == "retrieve") {
        if(data.value == null) {
            display.innerHTML = data.keys;
        } else {
            display.innerHTML = data.value;
        }
    } else if(data.cmd == "retrieveAll") {
        display.innerHTML = "";
        data.values.forEach(function(todo) {
            display.innerHTML += todo +"<br/>";
        });
    }
});
