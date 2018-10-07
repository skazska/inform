const logUpdate = require('log-update');

const Group = require('./group');

// TODO tests for Inform, separate output, and make definable through options, exclude log-update

class Inform {
    constructor (text) {
        this.groups = [];
        this.addGroup({text: text});
        this._promise = new Promise((resolve) => {
            this._complete = () => {
                resolve();
            }
        });
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
        const group = new Group(null, options);
        group.on('change', (event) => {
            this.render();
        });
        group.on('end', () => {
            this._checkEnd();
        });
        this.groups.push(group);
        return group;
    }

    get promise () {
        return this._promise;
    }

    /**
     * checks if all informers are done then sets staus 3 and fire 'end'
     * @private
     */
    _checkEnd () {
        if (this.groups.every(informer => informer.isDone)) {
            this._status = 3;
            this._complete();
        }
    }

    renderText () {
        const text = this.groups
            .map(group => {
                return group.textInfo.statusText + ' - ' + group.textInfo.text + '\n' +
                    group.textInfo.children.map(info => {
                        return '  ' + info.statusText + ' - ' + info.text + '\n        ' + info.info;
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