const logUpdate = require('log-update');

const { Group } = require('./informer');

class Inform {
    constructor (text) {
        this.groups = [];
        this.addGroup(text);
    }

    get group () {
        if (!this.groups.length) return;
        return this.groups[0];
    }

    addGroup (text) {
        const group = new Group(text);
        this.groups.push(group);
        return group;
    }

    render () {

        const info = this.groups.map(group => {
            
        });
        logUpdate()
    }
}


ex