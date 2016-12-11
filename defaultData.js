var defaultData = [];
(function() {
    var garbage = new TodoItemModel("Take out garbage", false);
    var litter = new TodoItemModel("Clean litter box", true);

    var chores = new TodoListModel("Chores", false);
    chores.add(garbage, litter);
    defaultData.push(chores);
})();
