const chai = require('chai');
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;

const { Group } = require('../informer');

describe('Group', () => {
    describe('#constructor(options)', () => {
        const options = {
            failText: 'damn',
            pendingText: 'waiting',
            inProcessText: 'doing',
            doneText: 'did',
            text: 'it'
        };
        it('should return instance having status statusText for (pending) status, textInfo should include children array', () => {
            const group = new Group(options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({status: 'waiting', text: 'it', children: []});
        });
        it('should allow add informer', () => {
            const group = new Group(options);
            group.addInformer(options);

            expect(group.status).to.be.equal(1);
            expect(group.statusText).to.be.equal('waiting');
            expect(group.textInfo).to.be.eql({
                status: 'waiting', text: 'it', children: [
                    {status: 'waiting', text: 'it'}
                ]
            });
        });
        it('should change status on child status change', () => {
            const group = new Group(options);
            const informer = group.addInformer(options);
            group.addInformer(options);

            const statuses = [2, 1];
            const statusTexts = ['doing', 'waiting'];
            const childrens = [
                [{status: 'doing', text: 'it'}, {status: 'waiting', text: 'it'}],
                [{status: 'waiting', text: 'it'}, {status: 'waiting', text: 'it'}]
            ];

            informer.statusSubject.subscribe({
                next: value => {
                    expect(value).equal(statuses.pop());
                    expect(informer.status).equal(value);
                    expect(informer.statusText).to.be.equal(statusTexts.pop());
                    expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it', children: childrens.pop()});
                },
                complete: () => {
                    expect(informer.status).equal(2);
                    expect(informer.statusText).to.be.equal('doing');
                    expect(informer.textInfo).to.be.eql({
                        status: informer.statusText, text: 'it',children: [
                            {status: 'doing', text: 'it'}
                        ]
                    });
                    done();
                }
            });

            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            informer.task = promise;
        });

        it('should complete as all children complete', (done) => {
            const promise = new Promise((resolve, reject )=> setImmediate(reject, new Error('error')));
            const informer = new Informer(null, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            const statuses = [0, 2, 1];
            const statusTexts = ['damn', 'doing', 'waiting'];

            informer.statusSubject.subscribe({
                next: value => {
                    expect(value).equal(statuses.pop());
                    expect(informer.status).equal(value);
                    expect(informer.statusText).to.be.equal(statusTexts.pop());
                    expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
                },
                complete: () => {
                    expect(informer.status).equal(0);
                    expect(informer.statusText).to.be.equal('damn');
                    expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
                    done();
                }
            });

            informer.task = promise;

        });
        it('should have statusSubject property which provides new infos on subscribed 2', (done) => {
            const promise = new Promise(resolve => setImmediate(resolve, 'bingo'));
            const informer = new Informer(promise, {
                failText: 'damn',
                pendingText: 'waiting',
                inProcessText: 'doing',
                doneText: 'did',
                text: 'it'
            });
            const statuses = [3, 2];
            const statusTexts = ['did', 'doing'];

            informer.statusSubject.subscribe({
                next: value => {
                    expect(value).equal(statuses.pop());
                    expect(informer.status).equal(value);
                    expect(informer.statusText).to.be.equal(statusTexts.pop());
                    expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
                },
                complete: () => {
                    expect(informer.status).equal(3);
                    expect(informer.statusText).to.be.equal('did');
                    expect(informer.textInfo).to.be.eql({status: informer.statusText, text: 'it'});
                    done();
                }
            });
        });
    });
});