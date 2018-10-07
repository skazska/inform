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
    this.promise = task
        .then(data => {
            this.status = STATUS.DONE;
            return this.status;
        })
        .catch(err => {
            this.status = STATUS.FAILED;
            return this.status;
        });
}

module.exports = TaskStatus;