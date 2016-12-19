let Rx = require("rx");
let RxDOM = require("rx-dom");
Rx.DOM = RxDOM;
let TodoListService = require("./persist.js");
let service = new TodoListService("todolist");

let openObserver = Rx.Observer.create(function(e) {
    console.log("Socket opened");
});

let closingObserver = Rx.Observer.create(function(e) {
    console.log("Socket is about to close");
});

MyWebSocket = Rx.DOM.fromWebSocket(
    "localhost:8080",
    null,
    openObserver,
    closingObserver);
observable = MyWebSocket.share();

observable.subscribe(e => {
    let message = JSON.parse(e.data);
    let command = message.command;
    if (command == "save") {
        let todoLists = message.data;
        service.saveTodoLists(...todoLists);
    } else if(command == "fetch") {
        service.getAllTodoLists().then((todoLists) => {
            let retMessage = {
                command: "save",
                data: todoLists
            };
            MyWebSocket.onNext(JSON.stringify(retMessage));
        });
    }
});
