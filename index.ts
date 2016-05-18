/// <reference path="typings/main.d.ts" />

import _ = require('lodash');
import net = require('net');
import irc = require('slate-irc');
import {cfg} from './config';
import * as nano from './nanobot';

const EVENTS = [
    'data',
    'welcome',
    'message',
    'notice',
    'motd',
    'join',
    'part',
    'nick',
    'quit',
    'names',
];

class Bot {
    private stacks = {};
    private client: irc.Client;
    private cfg: any;

    constructor(client: irc.Client) {
        this.client = client;
        
        EVENTS.forEach(n => this.client.on(n, data => {
            if (!this.stacks[n]) return;
            this.run(data, this.stacks[n]);
        }));
    }

    use(event: string, fn: nano.Middleware) {
        if (!this.stacks[event]) this.stacks[event] = [];
        this.stacks[event].push(fn);
    }

    connect(cfg) {
        this.cfg = cfg;

        this.client.nick(cfg.nick);
        this.client.pass(cfg.password);
        this.client.user(cfg.username, cfg.user);
        this.client.join(cfg.channel);
    }

    private run(data: any, stack: nano.Middleware[]) {
        let cont = false;
        let next = () => { cont = true };
        for (var i = 0; i < stack.length; i++) {
            stack[i](this.client, data, next);
            if (!cont) break;
        }
    }
}

const stream = net.connect({
    port: 6667,
    host: 'irc.freenode.org'
});

const client = irc(stream);

const bot = new Bot(client);

bot.use('data', (client, data) => {
    console.log(data);
});

bot.connect(cfg);