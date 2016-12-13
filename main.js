let service = new TodoListService("todolist");

let loc = window.location, new_uri;
if(loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}
new_uri += "//" + loc.host;
var ws = new WebSocket(new_uri);

