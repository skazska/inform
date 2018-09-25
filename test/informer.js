const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { Informer } = require('../informer');

describe('Informer', () => {
    describe('#constructor(task, options)', () => {
        it('should return instance having status statusText and textInfo for (in process) status when created with task', () => {
            const promise = new Promise(resolve => setImmediate(resolve, 'something'));
            const informer = new Informer(promise, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });

            expect(informer.status).to.be.equal(2);
            expect(informer.statusText).to.be.equal('doing');
            expect(informer.textInfo).to.be.eql({status: 'doing', text: 'it'});
            return expect(promise).to.be.fulfilled;
        });
        it('should return instance having status statusText and textInfo for (pending) status when created without task', () => {
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });

            expect(informer.status).to.be.equal(1);
            expect(informer.statusText).to.be.equal('waiting');
            expect(informer.textInfo).to.be.eql({status: 'waiting', text: 'it'});
        });
        it('should have statusSubject property which provides new infos on subscribed ', () => {
            const promise = new Promise(resolve => setImmediate(resolve, 'something'));
            const informer = new Informer(promise, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            const statuses = [0, 2];
            const statusNames = ['failed', 'in-process'];

            informer.statusSubject.subscribe({
                next: value => {
                    expect(pts.status).equal(statuses.pop());
                    expect(pts.statusName).equal(statusNames.pop());
                },
                complete: () => {
                    expect(pts.status).equal(0);
                    expect(pts.statusName).equal('failed');
                }
            });
            expect(informer.status).to.be.equal(2);
            expect(informer.statusText).to.be.equal('doing');
            expect(informer.textInfo).to.be.eql({status: 'doing', text: 'it'});
            return expect(promise).to.be.fulfilled;
        });
    });
});