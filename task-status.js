const EventEmitter = require('events');
const {STATUSES, STATUS} = require('./constants');

/**
 * Common task status class
 */
class TaskStatus extends EventEmitter {
    /**
     * @param {number} [status]
     */
    constructor (status) {
        super();
        this._status = status || STATUS.PENDING;
        this.isDone = false;
    }

    /**
     * status getter
     * @return {number}
     */
    get status () {
        return this._status;
    }

    /**
     * status setter
     * @param {number} status
     */
    set status (status) {
        this._status = status;
        this.emit('change', this._composeChangeEvent());
        if (status === STATUS.FAILED || status === STATUS.DONE) this.complete();
    }

    /**
     * status name
     * @return {string}
     */
    get statusName () {
        return TaskStatus.statusName(this.status);
    }

    /**
     * task setter
     * @param {*} task
     */
    set task (task) {
        this.status = STATUS.IN_PROCESS;
        this.taskStatusMonitor(task);
    }

    /**
     * promise getter
     * @return {Promise<any>}
     */
    get promise () {
        if (this.isDone) {
            if (this.status === STATUS.FAILED) {
                return Promise.reject(this._composeChangeError());
            }
            if (this.status === STATUS.DONE) {
                return Promise.resolve(this._composeChangeEvent());
            }
        } else {
            if (!this._promise) this._promise = new Promise((resolve, reject) => {
                this._promiseResolve = resolve;
                this._promiseReject = reject;
            });
            return this._promise;
        }
    }

    /**
     * resolve of reject all promises
     * @param {'resolve'|'reject'} fn
     * @param {*} val
     * @private
     */
    _processPromises (fn, val) {
        fn = '_promise' + fn[0].toUpperCase() + fn.substr(1);
        if (!!this[fn]) this[fn](val);
    }

    /**
     * composes change event
     * @private
     */
    _composeChangeEvent () {
        return {
            status: this.status,
            statusName: this.statusName
        }
    }

    /**
     * composes change event
     * @private
     */
    _composeChangeError () {
        if (!this.error) this.error = new Error(this.statusName);
        this.error.status = this.status;
        this.error.statusName = this.statusName;
        return this.error;
    }

    /**
     * returns instance of TaskStatus suitable for task type
     * @param task
     * @return {TaskStatus}
     */
    taskStatusMonitor (task) {
        if (task instanceof Promise) promisedTaskMonitor.call(this, task);
    }

    /**
     * sets IN_PROCESS status
     */
    inProcess () {
        this.status = STATUS.IN_PROCESS;
    }

    /**
     * sets DONE status
     */
    done () {
        this.status = STATUS.DONE;
    }

    /**
     * sets FAILED status
     */
    failed () {
        this.status = STATUS.FAILED;
    }

    /**
     * finish status monitoring trigger
     */
    complete () {
        this.isDone = true;
        if (this.status === STATUS.FAILED) {
            this._processPromises ('reject', this._composeChangeError());
        }
        if (this.status === STATUS.DONE) {
            this._processPromises('resolve', this._composeChangeEvent());
        }
        this.emit('end');
    }

    /**
     * returns status name for status
     * @param {number} status
     * @return {string}
     */
    static statusName (status) {
        return STATUSES[status];
    }
}

/**
 * promised task status monitor
 */
function promisedTaskMonitor (task) {
    //there is no effect on original promise, as no insertion in then/catch chain happening, keep in this.promise for test purposes
    task
        .then(data => {
            this.data = data;
            this.status = STATUS.DONE;
        })
        .catch(err => {
            this.error = err;
            this.status = STATUS.FAILED;
        });
}

module.exports = TaskStatus;