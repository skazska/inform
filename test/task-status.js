const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const TaskStatus = require('../task-status');

describe('TaskStatus', () => {
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
        it('should emit "change", which delivers a status change and "complete" on task done', (done) => {
            const pts = new TaskStatus();
            expect(pts.status).equal(1);
            expect(pts.statusName).equal('pending');

            let status = 2;
            pts.on('change', value => {
                expect(value).to.be.equal(status++);
            });
            pts.on('end', () => {
                expect(pts.status).equal(3);
                expect(pts.statusName).equal('done');
                done();
            });

            pts.task = new Promise((resolve) => {
                setImmediate(()=> {
                    resolve('data');
                });
            });
        });
        it('should it should get last status right after sunscribe and have status 0 on promise reject', () => {
            const promise = new Promise((resolve, reject) => {
                setImmediate(()=>{
                    reject(new Error('error'));
                });
            });
            const pts = new TaskStatus();
            pts.task = promise;
            expect(pts.status).equal(2);
            expect(pts.statusName).equal('in-process');


            const statuses = [0];
            const statusNames = ['failed'];
            pts.on('change', value => {
                expect(pts.status).equal(statuses.pop());
                expect(pts.statusName).equal(statusNames.pop());
            });
            pts.on('end', () => {
                expect(pts.status).equal(0);
                expect(pts.statusName).equal('failed');
            });

            return expect(promise).to.be.rejectedWith(Error);
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