import RSVP = require('rsvp');
import irc = require('slate-irc');
import net = require('net');

import {Bot, BotConfig} from './nanobot';

var speak = require('speakeasy-nlp');

const cfg: BotConfig = {
    nick: 'Methbot',
    password: 'Foo123',
    user: 'https://github.com/basp/methbot',
    username: 'Methbot',
    channel: '##vanityguild'
};

const stream = net.connect({
    port: 6667,
    host: 'irc.freenode.org'
});

const client = irc(stream);
const bot = new Bot(client);

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
    
});

bot.connect(cfg);
