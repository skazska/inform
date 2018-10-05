const Informer = require('./informer');

class Group extends Informer {
    constructor (options) {
        super(null, options);
        this.informers = [];

        this.informerChangeHandler = (value) => {
            if (value.status === 2 && this.status === 1) {
                this.status = 2; // <-- this will emit 'change'
            } else {
                this.emit('change', this._composeChangeEvent());
            }
        };

        this.informerEndHandler = () => {
            this._checkEnd();
        }
    }

    /**
     * add informer for a task
     * @param {Promise} task
     * @param {object} options
     */
    addInformer (task, options) {
        const informer = new Informer(task, options);
        if (informer.status === 2 && this.status === 1) this.status = 2;
        informer.on('change', this.informerChangeHandler);
        informer.on('end', this.informerEndHandler);
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

    /**
     * unsubscribe from all informers, and set own status to fail
     */
    abort () {
        this.informers.forEach(informer => {
            informer.removeListener('change', this.informerChangeHandler);
            informer.removeListener('end', this.informerEndHandler);
        });
        this._status = 0;
        this.complete();
    }

    /**
     * checks if all informers are done then sets staus 3 and fire 'end'
     * @private
     */
    _checkEnd () {
        if (this.informers.every(informer => informer.isDone)) {
            this._status = 3;
            this.complete();
        }
    }
}

module.exports = Group;