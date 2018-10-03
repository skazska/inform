const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const expect = chai.expect;

const Informer = require('../informer');

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
    });
    describe('@status, @statusText, @textInfo', () => {
        it('should change on task set and then fail', () => {
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            expect(informer.status).equal(1);
            expect(informer.statusText).to.be.equal('waiting');
            expect(informer.textInfo).to.be.eql({status: 'waiting', text: 'it'});

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                informer.on('change', handler);
                informer.on('end', () => {
                    resolve({handler: handler, informer: informer});
                });
            });

            informer.task = promise;

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 2}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].status': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'informer.status': 0}),
                expect(result).to.eventually.nested.include({'informer.statusName': 'failed'})
            ]);
        });
        it('should change on task done', () => {
            const promise = new Promise(resolve => setImmediate(resolve, 'bingo'));
            const informer = new Informer(promise, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            expect(informer.status).equal(2);
            expect(informer.statusText).to.be.equal('doing');
            expect(informer.textInfo).to.be.eql({status: 'doing', text: 'it'});

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                informer.on('change', handler);
                informer.on('end', () => {
                    resolve({handler: handler, informer: informer});
                });
            });

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 1}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].status': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'informer.status': 3}),
                expect(result).to.eventually.nested.include({'informer.statusName': 'done'})
            ]);
        });
    });
});