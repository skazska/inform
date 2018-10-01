const EventEmitter = require('events');
const TASK_STATUSES = ['failed', 'pending', 'in-process', 'done'];

/**
 * Common task status class
 */
class TaskStatus extends EventEmitter {
    /**
     * @param {number} [status]
     */
    constructor (status) {
        super();
        this._status = status || 1;
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
        this.emit('change', status);
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
        this.status = 2;
        this.taskStatusMonitor(task);
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
        return TASK_STATUSES[status];
    }
}

/**
 * promised task status monitor
 */
function promisedTaskMonitor (task) {
    //there is no effect on original promise, as no insertion in then/catch chain happening, keep in this.promise for test purposes
    this.promise = task
        .then(data => {
            this.status = 3;
            this.complete();
            return this.status;
        })
        .catch(err => {
            this.status = 0;
            this.complete();
            return this.status;
        });
}

module.exports = TaskStatus;