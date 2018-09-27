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
        it('should change texts on status change 1', (done) => {
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            const statuses = [0, 0, 2, 1];
            const statusTexts = ['damn', 'damn', 'doing', 'waiting'];

            function check (value) {
                expect(value).equal(statuses.pop());
                expect(informer.status).equal(value);
                expect(informer.statusText).to.be.equal(statusTexts.pop());
                expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
            }

            check(1);
            informer.status.on('change', check);
            informer.status.on('end', check.bind(0));
            informer.status.on('end', done);

            informer.task = promise;
        });
        it('should change texts on status change 2', (done) => {
            const promise = new Promise(resolve => setImmediate(resolve, 'bingo'));
            const informer = new Informer(promise, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            const statuses = [3, 3, 2];
            const statusTexts = ['did', 'did', 'doing'];

            function check (value) {
                expect(value).equal(statuses.pop());
                expect(informer.status).equal(value);
                expect(informer.statusText).to.be.equal(statusTexts.pop());
                expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
            }

            check(1);
            informer.status.on('change', check);
            informer.status.on('end', check.bind(3));
            informer.status.on('end', done);
        });
    });
});