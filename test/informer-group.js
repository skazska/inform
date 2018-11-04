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

    describe('#constructor(task, options)', () => {
        it('should return instance having status statusText for (pending) status, textInfo should include children array', () => {
            const group = new Group(null, options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({statusText: 'waiting', text: 'it', info: '', children: []});
        });
        it('should return instance having 1 informer for task, have statusText for (in-process) status, fire change and end on task complete', () => {
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            const group = new Group(promise, options);
            expect(group.status).to.be.equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo).to.be.eql({statusText: 'doing', text: 'it', info: '', children: [
                {statusText: 'doing', text: 'main task', info: ''}
            ]});
            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });
            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 2}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].text': 'main task'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].info': 'error'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].text': 'main task'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'error'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);

        });
    });
    describe('#addInformer', () => {
        it('should allow add informer which info appear in children of textInfo', () => {
            const group = new Group(null, options);
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            group.addInformer(promise, options);

            expect(group.status).to.be.equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo).to.be.eql({
                statusText: 'doing', text: 'it', info: '', children: [
                    {statusText: 'doing', text: 'it', info: ''}
                ]
            });
        });
        it('should allow add informer without task which info appear in children of textInfo', () => {
            const group = new Group(null, options);
            group.addInformer(null, options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({
                statusText: 'waiting', text: 'it', info: '', children: [
                    {statusText: 'waiting', text: 'it', info: ''}
                ]
            });
        });
    });

    describe('#addGroup', () => {
        it("should add group which also has it's info appear in children of textInfo", () => {
            const group = new Group(null, options);
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            group.addInformer(promise, options);
            group.addGroup(null, options);
            expect(group.status).to.be.equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo).to.be.eql({
                statusText: 'doing', text: 'it', info: '', children: [
                    {statusText: 'doing', text: 'it', info: ''},
                    {statusText: 'waiting', text: 'it', info: '', children: []}
                ]
            });
        });
        it("should add group with main task which also has it's info appear in children of textInfo", () => {
            const group = new Group(null, options);
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            group.addInformer(promise, options);
            const sbPromise = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            group.addGroup(sbPromise, options);
            expect(group.status).to.be.equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo).to.be.eql({
                statusText: 'doing', text: 'it', info: '', children: [
                    {statusText: 'doing', text: 'it', info: ''},
                    {statusText: 'doing', text: 'it', info: '', children: [
                            {statusText: 'doing', text: 'main task', info: ''},
                        ]}
                ]
            });
        });
    });

    describe('@status, @statusText, @textInfo', () => {
        it('should change status on child status change', () => {
            const group = new Group(null, options);
            const informer = group.addInformer(null, options);
            group.addInformer(null, options);
            expect(group.status).equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'waiting', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: ''}
            ]);

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
                expect(result).to.eventually.nested.include({'handler.args[0][0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'waiting'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].text': 'it'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'waiting'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].text': 'it'}),
                expect(result).to.eventually.nested.include({'group.status': 2}),
                expect(result).to.eventually.nested.include({'group.statusText': 'doing'})

            ]);
        });
    });
    describe('event "end"', () => {
        it('should fire as all children complete', () => {
            const group = new Group(null, options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'doing', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: ''}]);


            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer2.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 4}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].info': 'done'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });

        it('should fire as all children complete with subgroups', () => {
            const group = new Group(null, options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            group.addInformer(promise1, options);
            const subGroup = group.addGroup(null, options);


            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'doing', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: '', children: [
                ]}
            ]);

            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            subGroup.task = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 5}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].info': ''}), // would better if no exists at all
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].info': ''}),// would better if no exists at all
                expect(result).to.eventually.nested.include({'handler.args[4][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });

        it('should fire as all children complete and no interruption on some informers fail', () => {
            const group = new Group(null, options);
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
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'doing', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: ''}
            ]);


            const result = new Promise(resolve => {
                const handler = sinon.spy();
                group.on('change', handler);
                group.on('end', () => {
                    resolve({handler: handler, group: group});
                });
            });

            informer2.task = promise2;

            return Promise.all([
                expect(result).to.eventually.nested.include({'handler.callCount': 4}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[3][0].children[1].info': 'done'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'})

            ]);
        });

    });
    describe('#failed()', () => {
        it('if no main task defined, should set own status to 0 and stop firing events', () => {
            const group = new Group(null, options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(reject, new Error('done')));
            const informer1 = group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            const promise2 = new Promise((resolve, reject ) => {
                informer1.on('end', () => {
                    group.failed('failed');
                    setImmediate(resolve, 'done');
                });
            });

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'doing', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: ''}
            ]);

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
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].info': 'failed'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'group.status': 0}),
                expect(result).to.eventually.nested.include({'group.statusText': 'damn'}),
                expect(result).to.eventually.nested.include({'group.info': 'failed'})
            ]);
        });
    });

    describe('#done()', () => {
        it('should set own status to 3 and stop firing events?', () => {
            const group = new Group(null, options);
            const promise1 = new Promise((resolve, reject )=> setImmediate(resolve, 'done'));
            const informer1 = group.addInformer(promise1, options);
            const informer2 = group.addInformer(null, options);

            const promise2 = new Promise((resolve, reject ) => {
                informer1.on('end', () => {
                    group.done('group done');
                    setImmediate(reject, new Error('failed'));
                });
            });

            expect(group.status).equal(2);
            expect(group.statusText).to.be.equal('doing');
            expect(group.textInfo.children).to.be.eql([
                {statusText: 'doing', text: 'it', info: ''},
                {statusText: 'waiting', text: 'it', info: ''}
            ]);

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
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[0].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[0][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'handler.args[1][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].info': 'group done'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].statusText': 'did'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[0].info': 'done'}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].info': ''}),
                expect(result).to.eventually.nested.include({'handler.args[2][0].children[1].statusText': 'doing'}),
                expect(result).to.eventually.nested.include({'group.status': 3}),
                expect(result).to.eventually.nested.include({'group.statusText': 'did'}),
                expect(result).to.eventually.nested.include({'group.info': 'group done'})

            ]);
        });
    });

    describe('#wrapInformer(task, options)', () => {
        it('should add new Informer and return task', () => {
            const group = new Group(null, options);
            const promise1 = group.wrapInformer(new Promise((resolve, reject )=> setImmediate(resolve, 'done')), options);
            expect(promise1).to.be.a('Promise');
            expect(group.informers).to.have.property('length', 1);
            return Promise.all([
                expect(promise1).to.eventually.equal('done')
            ]);
        })
    });
});