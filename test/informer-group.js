const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const expect = chai.expect;

const Group = require('../group');

describe('Group', () => {
    const options = {
        failText: 'damn',
        pendingText: 'waiting',
        inProcessText: 'doing',
        doneText: 'did',
        text: 'it'
    };

    describe('#constructor(options)', () => {
        it('should return instance having status statusText for (pending) status, textInfo should include children array', () => {
            const group = new Group(options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({statusText: 'waiting', text: 'it', children: []});
        });
    });
    describe('#addInformer', () => {
        it('should allow add informer which info appear in children of textInfo', () => {
            const group = new Group(options);
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            group.addInformer(promise, options);

            expect(group.status).to.be.equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo).to.be.eql({
                statusText: 'doing', text: 'it', children: [
                    {statusText: 'doing', text: 'it'}
                ]
            });
        });
        it('should allow add informer without task which info appear in children of textInfo', () => {
            const group = new Group(options);
            group.addInformer(null, options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({
                statusText: 'waiting', text: 'it', children: [
                    {statusText: 'waiting', text: 'it'}
                ]
            });
        });
    });
    describe('@status, @statusText, @textInfo', () => {
        it('should change status on child status change', () => {
            const group = new Group(options);
            const informer = group.addInformer(null, options);
            group.addInformer(null, options);
            expect(group.status).equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo.children).to.be.eql([{statusText: 'waiting', text: 'it'}, {statusText: 'waiting', text: 'it'}]);

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                informer.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 2}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'waiting'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'waiting'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].text': 'it'}),
                expect(result).to.eventually.nested.include({'group.status': 2}),
                expect(result).to.eventually.nested.include({'group.statusText': 'doing'})

            ]);
        });
    });
    describe('event complete', () => {
        it('should fire as all children complete', () => {
            const group = new Group(options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([{statusText: 'doing', text: 'it'}, {statusText: 'waiting', text: 'it'}]);


            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer2.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 3}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });
        it('should fire as all children complete no interruption on some informers fail', () => {
            const group = new Group(options);
            const promise1 = new Promise((resolve, reject ) => setImmediate(reject, new Error('done')));
            const promise2 = new Promise((resolve, reject ) => {
                promise1.catch(() => {
                    setImmediate(resolve, 'done');
                });
            });

            group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([{statusText: 'doing', text: 'it'}, {statusText: 'waiting', text: 'it'}]);


            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer2.task = promise2;

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 3}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });

    });
    describe('abort', () => {
        it('should set own status to 0 and stop firing events', () => {
            const group = new Group(options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(reject, new Error('done')));
            const informer1 = group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            const promise2 = new Promise((resolve, reject ) => {
                informer1.on('end', () => {
                    group.abort();
                    setImmediate(resolve, 'done');
                });
            });

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([{statusText: 'doing', text: 'it'}, {statusText: 'waiting', text: 'it'}]);

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer2.task = promise2;

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 2}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'group.status': 0}),
                expect(result).to.eventually.nested.include({'group.statusText': 'damn'})

            ]);
        });
    });
});