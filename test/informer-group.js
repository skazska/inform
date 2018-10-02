const sinon = require('sinon');
const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const expect = chai.expect;

const { Group } = require('../informer');

describe('Group', () => {
    const options = {
        failText: 'damn',
        pendingText: 'waiting',
        inProcessText: 'doing',
        doneText: 'did',
        text: 'it'
    };

    function createCheck (group, statuses, statusTexts, childrens) {
        return (value) => {
            expect(value).equal(statuses.pop());
            expect(group.status).to.be.equal(value);
            expect(group.statusText).to.be.equal(statusTexts.pop());
            expect(group.textInfo).to.include({status: group.statusText, text: 'it'});
            expect(group.textInfo.children).to.eql(childrens.pop());
        }
    }

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
        it('should change status on child status change', (done) => {
            const group = new Group(options);
            const informer = group.addInformer(null, options);
            group.addInformer(null, options);
            const check = createCheck(
                group,
                [2, 2, 1],
                ['doing', 'doing', 'waiting'],
                [
                    [{status: 'done', text: 'it'}, {status: 'waiting', text: 'it'}],
                    [{status: 'doing', text: 'it'}, {status: 'waiting', text: 'it'}],
                    [{status: 'waiting', text: 'it'}, {status: 'waiting', text: 'it'}]
                ]
            );
            check(1);

            const handler = sinon.spy();
            group.on('change', handler);

            informer.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));

            group.on('end', () => {
                expect(handler.callCount).to.equal(3);
                handler.args.forEach((args) => {

                });

                done();
            });
        });
    });
    describe('event complete', () => {
        it('should fire as all children complete', (done) => {
            const group = new Group(options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            const statuses = [3, 2, 2, 2, 2];
            const statusTexts = ['did', 'doing', 'doing', 'doing', 'doing'];
            const childrens = [
                [{status: 'did', text: 'it'}, {status: 'did', text: 'it'}],
                [{status: 'did', text: 'it'}, {status: 'did', text: 'it'}],
                [{status: 'did', text: 'it'}, {status: 'doing', text: 'it'}],
                [{status: 'doing', text: 'it'}, {status: 'doing', text: 'it'}],
                [{status: 'doing', text: 'it'}, {status: 'waiting', text: 'it'}]
            ];

            function check (value) {
                expect(value).equal(statuses.pop());
                expect(group.status).to.be.equal(value);
                expect(group.statusText).to.be.equal(statusTexts.pop());
                expect(group.textInfo).to.include({status: group.statusText, text: 'it'});
                expect(group.textInfo.children).to.be.eql(childrens.pop());
            }

            check(2);
            group.on('change', check);

            group.on('end', check.bind(this, 3));
            group.on('end', done);

            informer2.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
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