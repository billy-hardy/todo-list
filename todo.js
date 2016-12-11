class TodoItemModel {
    constructor(content = "", done = false) {
        this.id = getUUID();
        this.content = content;
        this.done = done;
    }

    toJSON() {
        return {
            id: this.id,
            content: this.content,
            done: this.done
        };
    }
}

class TodoListModel {
    constructor(name = "", archived = false, todos = []) {
        this.id = getUUID();
        this.name = name;
        this.archived = archived;
        this.todos = todos;
    }

    add(...todos) {
        this.todos.push(...todos);
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            archived: this.archived,
            todos: this.todos
        };
    }
}

function getUUID() {
    function r4() {
        function rand() {
            return Math.floor(Math.random()*10)+'';
        }
        return rand()+rand()+rand()+rand();
    }
    return r4()+r4()+r4()+r4();
}
