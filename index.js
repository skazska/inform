const logUpdate = require('log-update');

const Group = require('./group');

// TODO add tests for Inform

class Inform extends Group {
    constructor (text, renderer) {
        super(null, {text: text});
        this.renderer = renderer || logUpdate;
        this.on('change', this.render.bind(this));
    }

    renderText () {
        const text = this.informers
            .map(informer => {
                return informer.textInfo.statusText + ' - ' + informer.textInfo.text + '\n' +
                    informer.textInfo.children.map(info => {
                        return '  ' + info.statusText + ' - ' + info.text + '\n        ' + info.info;
                    }).join('\n');
            }).join('\n\n');
        return text;
    }

    render () {
        this.renderer(this.renderText());
    }
}

module.exports = Inform;