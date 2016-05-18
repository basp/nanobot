/// <reference path="typings/main.d.ts" />

import _ = require('lodash');
import net = require('net');
import irc = require('slate-irc');

import {cfg} from './config';

interface NamesEvent {
    channel: string;
    names: { name: string, mode: string }[];
}

declare module "slate-irc" {
    interface Client {
        on(event: 'names', callback: (e: NamesEvent) => void);
    }
}

type Middleware = (data: any, next: () => void) => void;
type Stack = Middleware[];

class Bot {
    private stacks = {};
    private client: irc.Client;
    private cfg: any;

    constructor(client: irc.Client) {
        this.client = client;

        var events = [
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

        events.forEach(n => this.client.on(n, data => {
            if (!this.stacks[n]) return;
            this.run(data, this.stacks[n]);
        }));
    }

    use(event: string, fn: Middleware) {
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

    private run(data: any, stack: Middleware[]) {
        let cont = false;
        let next = () => { cont = true };
        for (var i = 0; i < stack.length; i++) {
            stack[i](data, next);
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

// bot.use('data', (x: irc.DataEvent) => console.log(x));

bot.use('names', (x: NamesEvent) => console.log(x.names));
bot.use('names', (x: NamesEvent) => console.log(x.channel));
bot.connect(cfg);