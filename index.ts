/// <reference path="typings/main.d.ts" />

import _ = require('lodash');
import net = require('net');
import irc = require('slate-irc');

// https://github.com/csauve/node-greenman


// const stream = net.connect({
//     port: 6667,
//     host: 'irc.freenode.org'
// });

// const client = irc(stream);



// https://github.com/Zlobin/es-middleware
class Bot {
    use(fn) {
        this.run = (stack =>
            next =>
                stack(() =>
                    fn.call(this, next.bind(this))
                )
        )(this.run);

        return this;
    }

    public run = next => next();
}

const bot = new Bot();

bot.use(next => {
    console.log('foo');
    next();
});

bot.use(next => {
    console.log('bar');
    next();
});

bot.run(() => console.log('quux'));