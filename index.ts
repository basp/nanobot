/// <reference path="typings/main.d.ts" />

import _ = require('lodash');
import net = require('net');
import irc = require('slate-irc');
import {cfg} from './config';
import * as nano from './nanobot';

import {greeter} from './greeter';
import {Bot} from './nanobot';

const stream = net.connect({
    port: 6667,
    host: 'irc.freenode.org'
});

const client = irc(stream);

const bot = new Bot(client);

bot.use('data', (client, data, next) => {
    console.log(data);
    next();
});

bot.use('names', greeter([cfg.nick]))

bot.use('message', (client, e: irc.MessageEvent, next) => {
    // Do stuff here...
    next();
});

bot.use('message', (client, e: irc.MessageEvent, next) => {
    // Or here... 
});

bot.connect(cfg); 