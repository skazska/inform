const EventEmitter = require('events');
const TaskStatus = require('./task-status');

/**
 * produces text info for task
 */
class Informer extends EventEmitter {
    /**
     * @typedef {Object} Informer~Options
     * @property {string} failText - .
     * @property {string} pendingText - .
     * @property {string} inProcessText - .
     * @property {string} doneText - .
     */
    /**
     *
     * @param {Promise|any} task
     * @param {Informer~Options} options
     */
    constructor (task, options) {
        super();
        this.text = options.text;
        this.statusTexts = [
            options.failText || TaskStatus.statusName(0),
            options.pendingText || TaskStatus.statusName(1),
            options.inProcessText || TaskStatus.statusName(2),
            options.doneText || TaskStatus.statusName(3)
        ];

        this.taskStatus = new TaskStatus();
        if (task) this.task = task;
    }

    /**
     * informer's task setter
     * @param task
     */
    set task (task) {
        this.taskStatus.task = task;
    }

    /**
     * informer's task status
     * @return {number}
     */
    get status () {
        return (this.taskStatus && this.taskStatus.status);
    }

    /**
     * informer's task status text
     * @return {string}
     */
    get statusText () {
        return this.statusTexts[this.status];
    }

    /**
     * informer's task text info
     * @return {{status: string, text: string}}
     */
    get textInfo () {
        return {
            status: this.statusText,
            text: this.text
        }
    }


}

class Group extends Informer {
    constructor (options) {
        super(null, options);
        this.informers = [];
    }

    /**
     * add informer without a task
     * @param {Promise} task
     * @param {object} options
     */
    addInformer (options) {
        return this.addTaskInformer(null, options);
    }

    /**
     * add informer for a task
     * @param {Promise} task
     * @param {object} options
     */
    addTaskInformer (task, options) {
        const informer = new Informer(task, options);
        informer.status.on('change', value => {
            this.emit('change');
        });
        informer.status.on('end', () => {
            this._checkEnd();
        });
        this.informers.push({
            informer: informer
        });
        return informer;
    }

    /**
     * returns cumulative info
     * @return {*}
     */
    get textInfo () {
        const result = super.textInfo();
        result.children = this.informers.map(informer => {
            return informer.textInfo
        });
        return result;
    }

    _checkEnd () {
        if (this.informers.every(informer => informer.isDone)) this.emit('end');
    }
}

module.exports = {
    Informer: Informer,
    Group: Group
};