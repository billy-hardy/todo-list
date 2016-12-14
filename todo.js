class TodoItemModel {
    constructor(content = "", done = false) {
        this.id = getUUID();
        this.content = content;
        this.done = done;
    }

    static fromJSON(json) {
        let instance = new this(json.content || "", json.done || false);
        instance.id = json.id;
        return instance
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
    constructor(name = "", archived = false, todos = [], tags = []) {
        this.id = getUUID();
        this.name = name;
        this.archived = archived;
        this.todos = todos;
        this.tags = new Set(tags);
    }

    static fromJSON(json) {
        let todos = (json.todos||[]).map(todo => TodoItemModel.fromJSON(todo));
        let instance = new this(json.name || "", json.archived || false, todos, json.tags || []);
        instance.id = json.id;
        return instance
    }

    add(...todos) {
        this.todos.push(...todos);
    }

    addTag(...tags) {
        this.tags.add(...tags);
    }

    removeTag(...tags) {
        Array.from(tags).forEach(tag => {
            return this.tags.delete(tag);
        });
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            archived: this.archived,
            todos: this.todos,
            tags: Array.from(this.tags)
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
