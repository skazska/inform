const TaskStatus = require('./task-status');

/**
 * produces text info for task
 */
class Informer extends TaskStatus {
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

        if (task) this.task = task;
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

    /**
     * composes change event
     * @private
     */
    _composeChangeEvent () {
        return this.textInfo;
    }
}

module.exports = Informer;