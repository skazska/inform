const logUpdate = require('log-update');

const Group = require('./group');

class Inform {
    constructor (text) {
        this.groups = [];
        this.addGroup({text: text});
    }

    /**
     * @return {Group}
     */
    get mainGroup () {
        if (!this.groups.length) return;
        return this.groups[0];
    }

    /**
     *
     * @param {Informer~Options} options
     * @return {Group}
     */
    addGroup (options) {
        const group = new Group(options);
        group.on('change', (event) => {
            this.render();
        });
        this.groups.push(group);
        return group;
    }

    renderText () {
        const text = this.groups
            .map(group => {
                return group.textInfo.statusText + ' - ' + group.textInfo.text + '\n' +
                    group.textInfo.children.map(info => {
                        return '  ' + info.statusText + ' - ' + info.text;
                    }).join('\n');
            }).join('\n\n');
        return text;
    }

    render () {

        const info = this.groups.map(group => {
            
        });
        logUpdate(this.renderText());
    }
}

module.exports = Inform;