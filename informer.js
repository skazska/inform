const TaskStatus = require('./task-status');

/**
 * produces text info for task
 */
class Informer {
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
     * @return {BehaviorSubject}
     */
    get statusSubject () {
        return this.taskStatus && this.taskStatus.subject;
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
    constructor (text) {
        const promise = new Promise();
        super(promise, {text: text});
        this.promise = promise;
        this.informers = [];
    }

    done(text) {
        this.text = text;
        this.promise.resolve(true);
    }

    fail(text) {
        this.text = text;
        this.promise.reject(false);
    }

    /**
     * add informer for a task
     * @param {Promise} task
     * @param {object} options
     */
    addTaskInformer (task, options) {
        this.informers.push({
            informer: new Informer(task, options)
        });
    }

    get textInfo () {
        return this.informers
            .map(informer => {
                return informer.textInfo
            });
    }
}

module.exports = {
    Informer: Informer,
    Group: Group
};