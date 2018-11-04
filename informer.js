const TaskStatus = require('./task-status');
const {STATUS} = require('./constants');

/**
 * produces text info for task
 */
class Informer extends TaskStatus {
    /**
     * @typedef {Object} Informer~Options
     * @property {string} text
     * @property {string} [failText] - .
     * @property {string} [pendingText] - .
     * @property {string} [inProcessText] - .
     * @property {string} [doneText] - .
     * @property {function} [transformInfo]
     */
    /**
     *
     * @param {Promise|any} task
     * @param {Informer~Options} options
     */
    constructor (task, options) {
        super();
        this.text = options.text;
        this._info = '';
        if (typeof options.transformInfo === 'function') {
            this._transformInfo = options.transformInfo;
        } else {
            this._transformInfo = (data) => {
                if (typeof data === 'string') {
                    return data;
                } else {
                    return JSON.stringify(data);
                }
            };
        }
        this.statusTexts = [
            options.failText || TaskStatus.statusName(STATUS.FAILED),
            options.pendingText || TaskStatus.statusName(STATUS.PENDING),
            options.inProcessText || TaskStatus.statusName(STATUS.IN_PROCESS),
            options.doneText || TaskStatus.statusName(STATUS.DONE)
        ];

        if (task) this.task = task;
    }

    get status () {
        return super.status;
    }
    set status (status) {
        if (status === STATUS.DONE) {
            this._info = this._transformInfo(this.data);
        } else if (status === STATUS.FAILED) {
            this._info = this._transformInfo(this.error.message);
        }
        super.status = status;
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
            statusText: this.statusText,
            text: this.text,
            info: this.info || ''
        }
    }

    set info (val) {
        this._info = val;
        this.emit('change', this._composeChangeEvent());
    }

    get info () {
        return this._info;
    }

    /**
     * sets IN_PROCESS status and info
     * @param {string} info
     */
    inProcess (info) {
        this._info = info;
        super.inProcess();
    }

    /**
     * sets DONE status
     * @param {string} info
     */
    done (info) {
        this.data = info;
        super.done();
    }

    /**
     * sets FAILED status
     * @param {string} info
     */
    failed (info) {
        this.error = new Error(info);
        super.failed();
    }

    /**
     * composes change event
     * @private
     */
    _composeChangeEvent () {
        return Object.assign(this.textInfo, super._composeChangeEvent());
    }
}

module.exports = Informer;