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
            expect(informer.textInfo).to.be.eql({statusText: 'doing', text: 'it', info: ''});
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
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: ''});
        });
    });

    describe('#done, #inProcess, #failed', () => {
        it('should return instance having status statusText and textInfo for (in process) status when created with task', () => {
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });

            const handler = sinon.spy();
            const handler2 = sinon.spy();
            informer.on('change', handler);
            informer.on('end', handler2);

            expect(informer.status).to.be.equal(1);
            expect(informer.statusText).to.be.equal('waiting');
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: ''});
            informer.inProcess('info1');
            expect(informer.status).to.be.equal(2);
            expect(informer.statusText).to.be.equal('doing');
            expect(informer.textInfo).to.be.eql({statusText: 'doing', text: 'it', info: 'info1'});
            informer.done('info2');
            expect(informer.status).to.be.equal(3);
            expect(informer.statusText).to.be.equal('did');
            expect(informer.textInfo).to.be.eql({statusText: 'did', text: 'it', info: 'info2'});
            informer.failed('info3');
            expect(informer.status).to.be.equal(0);
            expect(informer.statusText).to.be.equal('damn');
            expect(informer.textInfo).to.be.eql({statusText: 'damn', text: 'it', info: 'info3'});

            expect(handler).to.nested.include({'callCount': 3});
            expect(handler).to.nested.include({'args[0][0].statusText': 'doing'});
            expect(handler).to.nested.include({'args[0][0].text': 'it'});
            expect(handler).to.nested.include({'args[0][0].info': 'info1'});
            expect(handler).to.nested.include({'args[1][0].statusText': 'did'});
            expect(handler).to.nested.include({'args[1][0].text': 'it'});
            expect(handler).to.nested.include({'args[1][0].info': 'info2'});
            expect(handler).to.nested.include({'args[2][0].statusText': 'damn'});
            expect(handler).to.nested.include({'args[2][0].text': 'it'});
            expect(handler).to.nested.include({'args[2][0].info': 'info3'});
            expect(handler2).to.nested.include({'callCount': 2});


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
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: ''});
        });
    });

    describe('#info()', () => {
        it('should set informer info and fire "change"', () => {
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });

            const handler = sinon.spy();
            informer.on('change', handler);

            expect(informer.status).to.be.equal(1);
            expect(informer.statusText).to.be.equal('waiting');
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: ''});

            informer.info = 'some info';
            expect(informer.status).to.be.equal(1);
            expect(informer.statusText).to.be.equal('waiting');
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: 'some info'});

            expect(handler).to.nested.include({'callCount': 1});
            expect(handler).to.nested.include({'args[0][0].statusText': 'waiting'});
            expect(handler).to.nested.include({'args[0][0].text': 'it'});
            expect(handler).to.nested.include({'args[0][0].info': 'some info'});
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
            expect(informer.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: ''});

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
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].info': 'error'}),
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
            expect(informer.textInfo).to.be.eql({statusText: 'doing', text: 'it', info: ''});

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                informer.on('change', handler);
                informer.on('end', () => {
                    resolve({handler: handler, informer: informer});
                });
            });

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 1}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].info': 'bingo'}),
                expect(result).to.eventually.nested.include({'informer.status': 3}),
                expect(result).to.eventually.nested.include({'informer.statusName': 'done'})
            ]);
        });
    });
});