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
            expect(group.textInfo).to.be.eql({status: 'waiting', text: 'it', children: []});
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
                status: 'doing', text: 'it', children: [
                    {status: 'doing', text: 'it'}
                ]
            });
        });
        it('should allow add informer without task which info appear in children of textInfo', () => {
            const group = new Group(options);
            group.addInformer(null, options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({
                status: 'waiting', text: 'it', children: [
                    {status: 'waiting', text: 'it'}
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
            expect(group.textInfo.children).to.be.eql([{status: 'waiting', text: 'it'}, {status: 'waiting', text: 'it'}]);

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
                expect(result).to.eventually.nested.include({'handler.args[0][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].status': 'waiting'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].status': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].status': 'waiting'}),
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
            expect(group.textInfo.children).to.be.eql([{status: 'doing', text: 'it'}, {status: 'waiting', text: 'it'}]);


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
                expect(result).to.eventually.nested.include({'handler.args[0][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].status': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].status': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].status': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].status': 'did'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });
    });
    xdescribe('abort', () => {
        it('should set own status to 0 and stop firing events', (done) => {
            const group = new Group(options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            group.addInformer(promise1, options);
            const informer2 = group.addInformer( options);

            const statuses = [3, 3, 2, 2, 2];
            const statusTexts = ['done', 'done', 'doing', 'doing', 'doing'];
            const childrens = [
                [{status: 'done', text: 'it'}, {status: 'done', text: 'it'}],
                [{status: 'done', text: 'it'}, {status: 'done', text: 'it'}],
                [{status: 'done', text: 'it'}, {status: 'doing', text: 'it'}],
                [{status: 'doing', text: 'it'}, {status: 'doing', text: 'it'}],
                [{status: 'doing', text: 'it'}, {status: 'waiting', text: 'it'}]
            ];

            function check (value) {
                expect(value).equal(statuses.pop());
                expect(group.status).to.be.equal(value);
                expect(group.statusText).to.be.equal(statusTexts.pop());
                expect(group.textInfo).to.be.eql({status: group.group.statusText, text: 'it'});
                expect(group.textInfo.children).to.be.eql(childrens.pop());
            }

            check(1);
            group.status.on('change', check);
            group.status.on('end', check.bind(0));
            group.status.on('end', done);

            informer2.task = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
        });
    });
});