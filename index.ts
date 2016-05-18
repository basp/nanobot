/// <reference path="typings/main.d.ts" />

import _ = require('lodash');
import net = require('net');
import irc = require('slate-irc');
import moment = require('moment');
import {cfg} from './config';
import * as nano from './nanobot';
import {greeter} from './greeter';
import {command} from './commands';

const stream = net.connect({
    port: 6667,
    host: 'irc.freenode.org'
});

const client = irc(stream);

const bot = new nano.Bot(client);

bot.use('data', (client, data, next) => {
    next();
});

bot.use('message', command(cfg.nick));

bot.use('names', greeter([cfg.nick]))

bot.connect(cfg); 