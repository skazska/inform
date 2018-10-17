const Informer = require('./informer');

class Group extends Informer {
    constructor (task, options) {
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
        };

        this.taskOptions = {
            text: options.taskText|| 'main task',
            failText: options.failText,
            pendingText: options.pendingText,
            inProcessText: options.inProcessText,
            doneText: options.doneText,
            transformInfo: options.transformInfo
        };
        this.task = task;
    }

    set task(task) {
        if (task) this.addInformer(task, this.taskOptions);
    }

    /**
     * sets listentrs on informer/group and adds to list
     * @param informer
     * @private
     */
    _addInformer (informer) {
        if (informer.status === 2 && this.status === 1) this.status = 2;
        informer.on('change', this.informerChangeHandler);
        informer.on('end', this.informerEndHandler);
        this.informers.push(informer);
    }

    /**
     * add informer for a task
     * @param {Promise} task
     * @param {object} options
     */
    addInformer (task, options) {
        const informer = new Informer(task, options);
        this._addInformer(informer);
        return informer;
    }

    /**
     *
     * @param {Promise} task
     * @param {Informer~Options} options
     * @return {Group}
     */
    addGroup (task, options) {
        const group = new Group(task, options);
        this._addInformer(group);
        return group;
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
    failed (info) {
        this.informers.forEach(informer => {
            informer.removeListener('change', this.informerChangeHandler);
            informer.removeListener('end', this.informerEndHandler);
        });
        super.failed(info);
    }



    /**
     * checks if all informers are done then sets staus 3 and fire 'end'
     * @private
     */
    _checkEnd () {
        if (this.informers.every(informer => informer.isDone)) {
            this._status = 3;
            this.emit('change', this._composeChangeEvent());
            this.complete();
        }
    }
}

module.exports = Group;