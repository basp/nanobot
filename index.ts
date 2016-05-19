/// <reference path="typings/index.d.ts" />

import _ = require('lodash');
import S = require('string');
import net = require('net');
import irc = require('slate-irc');
import moment = require('moment');
import * as utils from './utils';
import {cfg} from './config';
import * as nano from './nanobot';
import {greeter} from './plugins/greeter';
import {command} from './plugins/commands';

const RiveScript = require('rivescript');

function loadingDone() {
    brain.sortReplies();
    brain.setVariable('name', cfg.nick);

    brain.setSubroutine('random', (from, to) => {
        return Math.random();
    });
    
    brain.setSubroutine('dice', (args) => {
        return JSON.stringify(args); 
    });

    const stream = net.connect({
        port: 6667,
        host: 'irc.freenode.org'
    });

    const client = irc(stream);
    const bot = new nano.Bot(client);

    bot.use('data', (client, data, next) => {
        console.log(data);
        next();
    });

    bot.use('message', (client: irc.Client, data: irc.MessageEvent, next) => {
        const engaged = utils.parseBool(brain.getUservar(data.from, 'engaged')); 
        const topic = brain.getUservar(data.from, 'topic');
        if (engaged) console.log(`User ${data.from} with topic ${topic}.`);
        const aliases = cfg.aliases.map(x => x.toLowerCase());
        const s = S(data.message.toLowerCase());
        if (!engaged && !_(aliases).some(x => s.contains(x))) return;
        next();
    });

    bot.use('message', (client: irc.Client, data: irc.MessageEvent) => {
        brain.setUservar(data.from, 'from', data.from);
        const reply = brain.reply(data.from, data.message);
        client.send(cfg.channel, reply);
    });

    bot.use('names', greeter([cfg.nick]))

    bot.connect(cfg);
}

function loadingError(err) {
    console.error(err);
}

const brain = new RiveScript()
brain.loadDirectory('./brain', loadingDone, loadingError);