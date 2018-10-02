const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const expect = chai.expect;

const TaskStatus = require('../task-status');

describe('TaskStatus', () => {
    function createCheck (statuses, statusNames) {
        return (value, self) => {
            expect(value).equal(statuses.pop());
            expect(self.status).to.be.equal(value);
            expect(self.statusName).to.be.equal(statusNames.pop());
        }
    }

    describe('TaskStatus', () => {
        it('should have status 1 (pending) when instantiated without task)', () => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            expect(pts.statusName).equal('pending');
        });
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
                    resolve({handler: handler})
                });

                pts.task = new Promise((resolve) => { setImmediate(()=> { resolve('data'); }); });

            }).then((data) => {
                expect(data.handler.callCount).to.be.equal(2);
                data.handler.args.forEach((args) => {
                    expect(args[0].status).to.be.equal(statuses.pop());
                    expect(args[0].statusName).to.be.equal(statusNames.pop());
                });
                expect(pts.status).equal(3);
                expect(pts.statusName).equal('done');
            });

            return expect(promise).to.be.fulfilled;
        });
        it('should it should get last status right after sunscribe and have status 0 on promise reject', () => {
            const promise = new Promise((resolve, reject) => { setImmediate(()=>{ reject(new Error('error')); }); });
            const pts = new TaskStatus();
            pts.task = promise;
            expect(pts.status).equal(2);
            expect(pts.statusName).equal('in-process');

            const result = new Promise((resolve, reject) => {
                const handler = sinon.spy();
                pts.on('change', handler);
                pts.on('end', () => {
                    resolve(handler)
                });
            }).then(handler => {
                expect(handler.args[0][0].status).equal(0);
                expect(handler.args[0][0].statusName).equal('failed');

                expect(pts.status).equal(0);
                expect(pts.statusName).equal('failed');
            });

            return expect(result).to.be.fulfilled;
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

            expect(pts.promise).to.eventually.equal(3);
            expect(promise).to.eventually.equal('data');
            return expect(result).to.eventually.equal('done');
        });
    });

});