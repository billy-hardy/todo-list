var defaultData = [];
(function() {
    var garbage = new TodoItem("Take out garbage", false);
    var litter = new TodoItem("Clean litter box", true);

    var chores = new TodoList("Chores", false);
    chores.add(garbage, litter);
    defaultData.push(chores);
})();
