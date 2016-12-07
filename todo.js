class TodoItem {
    constructor(content, done) {
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

class TodoList {
    constructor(name, archived) {
        this.id = getUUID();
        this.name = name;
        this.archived = archived;
        this.todos = [];
    }

    add(...todos) {
        this.todos.push(...todo);
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
