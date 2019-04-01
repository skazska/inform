const Inform = require('./index');

const inform = new Inform('main');
const group = inform.addGroup(null, {
    failText: 'damn',
    pendingText: 'waiting',
    inProcessText: 'doing',
    doneText: 'did',
    text: 'it'
});
const informer = group.addInformer(new Promise((resolve, reject ) => setTimeout(() => {reject(new Error('done'))}, 100)), {
    failText: 'damn',
    pendingText: 'waiting',
    inProcessText: 'doing',
    doneText: 'did',
    text: 'it'
});

const promise1 = new Promise((resolve, reject ) => setTimeout(() => {reject(new Error('done'))}, 1000));
const promise2 = new Promise((resolve, reject ) => {
    promise1.catch(() => {
        setTimeout(() => { resolve('done')}, 2000);
    });
});

group.addInformer(promise1, {
    failText: 'damn',
    pendingText: 'waiting',
    inProcessText: 'doing',
    doneText: 'did',
    text: 'it'
});
const informer2 = group.addInformer(null, {
    failText: 'damn',
    pendingText: 'waiting',
    inProcessText: 'doing',
    doneText: 'did',
    text: 'it'
});

setTimeout(() => {
    informer2.task = promise2;
}, 500);

inform.promise.then(() => {
    console.log('resolved')
});