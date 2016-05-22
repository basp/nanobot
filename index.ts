import RSVP = require('rsvp');
import irc = require('slate-irc');
import net = require('net');

import {Bot} from './nanobot';
import {cfg} from './config';
import {init} from './markov-responder';

var speak = require('speakeasy-nlp');

const stream = net.connect({
    port: 6667,
    host: 'irc.freenode.org'
});

const client = irc(stream);
const bot = new Bot(client);

function logMarkovProgress(path: string): void {
    console.log(`Loaded ${path}`);
}

const promises = {
    cat: init('c:/temp/cat.txt', 4, logMarkovProgress),
    chat: init('c:/temp/chat-sanitized.log', 2, logMarkovProgress),
    plato: init('c:/temp/plato.txt', 3, logMarkovProgress),
    shakespeare: init('c:/temp/shakespeare.txt', 2, logMarkovProgress)
};

RSVP.hash(promises).then(r => {
    const cat: Markov = r.cat;
    const chat: Markov = r.chat;
    const plato: Markov = r.plato;
    const shakespeare: Markov = r.shakespeare;

    bot.use('data', data => {
        console.log(data);
    });

    bot.use('message', (e: irc.MessageEvent, next) => {
        const c = speak.classify(e.message);
        const s = speak.sentiment.analyze(e.message);
        console.log(c);
        console.log(`SCORE: ${s.score}`);
        next();
    });

    bot.msg(/meth|methbot/, (e: irc.MessageEvent, m) => {
        const msg = plato.respond(e.message)
            .map(x => x.trim())
            .join(' ');

        bot.say(cfg.channel, msg);
    });

    bot.connect(cfg);
});

