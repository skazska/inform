const Informer = require('./informer');

class Group extends Informer {
    constructor (options) {
        super(null, options);
        this.informers = [];
    }

    /**
     * add informer for a task
     * @param {Promise} task
     * @param {object} options
     */
    addInformer (task, options) {
        const informer = new Informer(task, options);
        if (informer.status === 2 && this.status === 1) this.status = 2;
        informer.on('change', value => {
            if (informer.status === 2 && this.status === 1) {
                this.status = 2; // <-- this will emit 'change'
            } else if (value !== 0) {
                this.emit('change', this._composeChangeEvent());
            }
        });
        informer.on('end', () => {
            this._checkEnd();
        });
        this.informers.push(informer);
        return informer;
    }

    /**
     * returns cumulative info
     * @return {*}
     */
    get textInfo () {
        const result = super.textInfo;
        result.children = this.informers.map(informer => {
            return informer.textInfo
        });
        return result;
    }

    _checkEnd () {
        if (this.informers.every(informer => informer.isDone)) {
            this._status = 3;
            this.emit('end');
        }
    }
}

module.exports = Group;