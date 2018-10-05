[![Build Status](https://travis-ci.org/skazska/inform.svg?branch=master)](https://travis-ci.org/skazska/inform)

# inform

Provide a tool to prepare and print-out information on tasks progress

`npm run demo` - to see a demo

## usage:

```javascript

const Inform = require('@skazska/inform');
const inform = new Inform('main');
const group = inform.mainGroup;
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


```