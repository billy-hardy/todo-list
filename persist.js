importScripts('/node_modules/idb-keyval/idb-keyval.js');

self.addEventListener("message", async function({data}) {
    let cmd = data.cmd;
    if(cmd == "create") {
        let success = await saveVal(data.value);
        self.postMessage({cmd});
    } else if(cmd == "retrieve") {
        let valToGet = data.value
        if(valToGet == null) {
            let keys = await getKeys();
            self.postMessage({cmd, keys});
        } else {
            let value = await getVal(data.value);
            self.postMessage({cmd, value});
        }
    } else if(cmd == "retrieveAll") {
        let values = await getAll();
        //Promise.all(values).then(function(values) {
        self.postMessage({cmd, values});
        //});
    }
});

function saveVal(value) {
    function getUUID() {
        function r4() {
            function rand() {
                return Math.floor(Math.random()*10)+'';
            }
            return rand()+rand()+rand()+rand();
        }
        return r4()+r4()+r4()+r4();
    }
    return idbKeyval.set(getUUID(), value);
}

function getKeys() {
    return idbKeyval.keys();
}

async function getAll() {
    let keys = await getKeys();
    let values = await Promise.all(keys.map(function(key) {
        return getVal(key);
    }));
    return values;
}

async function getVal(key) {
    return await idbKeyval.get(key);
}
