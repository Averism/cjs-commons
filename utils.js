String.prototype.replaceAll = function(from, to) { let v = this.toString(); while (v.indexOf(from) > -1) v = v.replace(from, to); return v }

String.prototype.$place = function(map){
    let s = this.toString()
    for(let key of Object.keys(map)){
        s = s.replaceAll("$"+key,map[key]);
    }
    return s;
}

String.prototype.regexPlace = function(pattern, to) {
    let change = function(original, i, value) {
        if (original.indexOf('$' + i) > -1) {
            original = original.replace('$' + i, value[i]);
            original = change(original, i + 1, value);
        }
        return original;
    }
    let s = this.toString();
    let r = pattern.exec(s);

    let trueto = r ? change(to, 1, r) : to;
    return this.replace(pattern, trueto);
}

String.prototype.regexPlaceAll = function(pattern, to) {
    let s = this.toString();
    while (pattern.exec(s))
        s = s.regexPlace(pattern, to);
    return s;
}

let arrayProxyHandler = {
    get: function(obj, prop){
        if(prop==="__value") return obj;
        if(prop==="__first") return obj?obj[0]:obj;
        let temp = obj.map(x => x[prop]).filter(x => typeof x !== 'undefined');
        let allFunction = true;
        for (let i of temp)
            if (typeof i !== "function") allFunction = false;
        if (allFunction) {
            temp = obj.map(x => x[prop]?x[prop].bind(x):null).filter(x => x != null);
            return function(...params) { return temp.map(x => x(...params)) };
        }
        return new Proxy(temp,arrayProxyHandler);
    },
    set: function(obj, prop, value){
        for(let o of obj) o[prop] = value;
    }
}

let selectorObj = function(v) {
    let o = {
        res: v || [],
        then: function(queries) {
            return window.DOMq(this.res, queries);
        },
        get: function() { return this.res },
        walk: function(path) {
            let c = Array.from(this.res);
            for (let p of path) {
                c = c.map(x => p >= 0 ? x.children[p] : x.parentNode).filter(x => typeof x !== "undefined");
            }
            return selectorObj(c);
        }
    };

    return new Proxy(o, {
        get: function(obj, prop) {
            switch (prop) {
                case 'walk':
                    return obj.walk.bind(obj);
                case 'then':
                    return obj.then.bind(obj);
                case 'get':
                    return obj.get.bind(obj);
                case 'res':
                    return obj.res;
                default:
                    return (new Proxy(obj.res, arrayProxyHandler))[prop];
            }
        }
    })
}

window.DOMq = function(parents, queries) {
    let res = selectorObj();
    if (!Array.isArray(parents)) parent = [parents];
    if (!Array.isArray(queries)) parent = [queries];
    for (let q of queries)
        for (let parent of parents) {
            res.res.push(...parent.querySelectorAll(q));
        }
    return res;
}

let lstoreHandler = {
    get: function(obj,prop){
        let res = window.localStorage.getItem(prop);
        if(res == null) return res;
        try{
            return JSON.parse(res);
        }catch(e){
            return res;
        }
    },
    set: function(obj, prop, value){
        window.localStorage.setItem(prop, JSON.stringify(value));
    }
}

window.lstore = new Proxy({},lstoreHandler);    
