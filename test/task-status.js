const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const expect = chai.expect;

const TaskStatus = require('../task-status');

describe('TaskStatus', () => {
    describe('#constructor', () => {
        it('should have status 1 (pending) when instantiated without task)', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            expect(pts.statusName).equal('pending');
        });
    });

    describe('status setter', () => {
        it('should fire "change" event on status set)', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            const handler = sinon.spy();
            const handler2 = sinon.spy();
            pts.on('change', handler);
            pts.on('end', handler2);
            pts.status = 2;
            pts.status = 3;
            pts.status = 0;
            expect(handler).to.nested.include({'callCount': 3});
            expect(handler).to.nested.include({'args[0][0].status': 2});
            expect(handler).to.nested.include({'args[0][0].statusName': 'in-process'});
            expect(handler).to.nested.include({'args[1][0].status': 3});
            expect(handler).to.nested.include({'args[1][0].statusName': 'done'});
            expect(handler).to.nested.include({'args[2][0].status': 0});
            expect(handler).to.nested.include({'args[2][0].statusName': 'failed'});
            expect(handler2).to.nested.include({'callCount': 2});
        });
    });

    describe('#inProcess()', () => {
        it('should set status to 2 fire "change" ', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            const handler = sinon.spy();
            pts.on('change', handler);
            pts.inProcess();
            expect(handler).to.nested.include({'callCount': 1});
            expect(handler).to.nested.include({'args[0][0].status': 2});
            expect(handler).to.nested.include({'args[0][0].statusName': 'in-process'});
        });
    });

    describe('#done()', () => {
        it('should set status to 3 isDone to true and fire "change" and "end"', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            const handler = sinon.spy();
            const handler2 = sinon.spy();
            pts.on('change', handler);
            pts.on('end', handler2);
            pts.done();
            expect(handler).to.nested.include({'callCount': 1});
            expect(handler).to.nested.include({'args[0][0].status': 3});
            expect(handler).to.nested.include({'args[0][0].statusName': 'done'});
            expect(handler2).to.nested.include({'callCount': 1});
            expect(pts.status).to.equal(3);
            expect(pts.statusName).to.equal('done');
            expect(pts.isDone).to.equal(true);
        });
    });

    describe('#failed()', () => {
        it('should set status to 0 isDone to true and fire "change" and "end"', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            const handler = sinon.spy();
            const handler2 = sinon.spy();
            pts.on('change', handler);
            pts.on('end', handler2);
            pts.failed();
            expect(handler).to.nested.include({'callCount': 1});
            expect(handler).to.nested.include({'args[0][0].status': 0});
            expect(handler).to.nested.include({'args[0][0].statusName': 'failed'});
            expect(handler2).to.nested.include({'callCount': 1});
            expect(pts.status).to.equal(0);
            expect(pts.statusName).to.equal('failed');
            expect(pts.isDone).to.equal(true);
        });
    });

    describe('work with promise task', function() {
        it('should change status 2 (in-process) when promise task is set through setter)', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            expect(pts.statusName).equal('pending');
            const promise = new Promise((resolve) => {
                setImmediate(resolve, 'data');
            });
            pts.task = promise;
            expect(pts.status).equal(2);
            expect(pts.statusName).equal('in-process');
            //just done test here
            return expect(promise).to.be.fulfilled;
        });
        it('should emit "change", which delivers a status change and "complete" on task done', () => {
            const statuses = [3, 2, 1];
            const statusNames = ['done', 'in-process', 'pending'];
            const pts = new TaskStatus();
            const promise = new Promise((resolve, reject) => {
                expect(pts.status).equal(statuses.pop());
                expect(pts.statusName).to.be.equal(statusNames.pop());

                const handler = sinon.spy();
                pts.on('change', handler);
                pts.on('end', () => {
                    resolve({handler: handler, pts: pts})
                });

                pts.task = new Promise((resolve) => { setImmediate(()=> { resolve('data'); }); });

            });

            return Promise.all([
                expect(promise).to.eventually.nested.include({'handler.callCount': 2}),
                expect(promise).to.eventually.nested.include({'handler.args[0][0].status': statuses.pop()}),
                expect(promise).to.eventually.nested.include({'handler.args[0][0].statusName': statusNames.pop()}),
                expect(promise).to.eventually.nested.include({'handler.args[1][0].status': statuses.pop()}),
                expect(promise).to.eventually.nested.include({'handler.args[1][0].statusName': statusNames.pop()}),
                expect(promise).to.eventually.nested.include({'pts.status': 3}),
                expect(promise).to.eventually.nested.include({'pts.statusName': 'done'})
            ]);
        });
        it('should get last status right after subscribe and have status 0 on promise reject', () => {
            const promise = new Promise((resolve, reject) => { setImmediate(()=>{ reject(new Error('error')); }); });
            const pts = new TaskStatus();
            pts.task = promise;
            expect(pts.status).equal(2);
            expect(pts.statusName).equal('in-process');

            const result = new Promise((resolve, reject) => {
                const handler = sinon.spy();
                pts.on('change', handler);
                pts.on('end', () => {
                    resolve({handler: handler, pts: pts});
                });
            });

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 1}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].status': 0}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusName': 'failed'}),
                expect(result).to.eventually.nested.include({'pts.status': 0}),
                expect(result).to.eventually.nested.include({'pts.statusName': 'failed'}),
            ]);
        });
        it('should have no effect on passed promise process chain', () => {
            const promise = new Promise((resolve) => {
                setImmediate(resolve, 'data');
            });

            const pts = new TaskStatus();
            pts.task = promise;
            const result = promise
                .then(data => {
                    expect(data).equal('data');
                    return 'data1'
                })
                .then(data => {
                    expect(data).equal('data1');
                    return 'done';
                });

            return Promise.all([
                expect(promise).to.eventually.equal('data'),
                expect(result).to.eventually.equal('done')
            ]);
        });
        it('should throw if task type is not supported', () => {
            const pts = new TaskStatus();
            const setter = function() {
                pts.task = function(err, data) {};
            };
            expect(setter).to.throw(Error, 'Task type was not recognized');
        });
    });
    describe('-promise', () => {
        it('should resolve on task done', () => {
            const promise = new Promise((resolve) => {
                setImmediate(resolve, 'data');
            });

            const pts = new TaskStatus();
            pts.task = promise;

            return Promise.all([
                expect(pts.promise).to.eventually.eql({ status: 3, statusName: 'done' }),
            ]);
        });
        it('should reject on fail', () => {
            const promise = new Promise((resolve, reject) => {
                setImmediate(reject, new Error('data'));
            });

            const pts = new TaskStatus();
            pts.task = promise;

            return expect(pts.promise).to.be.rejectedWith(Error, 'data')
        })
    })

});