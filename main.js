let service = new TodoListService("todolist");

let openObserver = Rx.Observer.create(function(e) {
    console.log("Socket opened");
});

let closingObserver = Rx.Observer.create(function(e) {
    console.log("Socket is about to close");
});

let socket = Rx.DOM.fromWebSocket(
    "wss://morning-spire-54006.herokuapp.com/",
    null,
    openObserver,
    closingObserver);
