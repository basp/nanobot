import RSVP = require('rsvp');
import irc = require('slate-irc');
import net = require('net');

declare module "slate-irc" {
    interface Client {
        on(event: 'names', callback: (e: NamesEvent) => void);
    }
}

export interface NamesEvent {
    channel: string;
    names: { name: string, mode: string }[];
}

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

export interface BotConfig {
    nick: string;
    password: string;
    username: string;
    user: string;
    channel: string;
}

export interface Bot {
    msg(pat: RegExp, fn: (e: irc.MessageEvent, m: RegExpExecArray) => void): Bot;
    msg(fn: (e: irc.MessageEvent) => void): Bot;
    pm(pat: RegExp, fn: (e: irc.MessageEvent, m: RegExpExecArray) => void): Bot;
    pm(fn: (e: irc.MessageEvent) => void): Bot;
    any(pat: RegExp, fn: (e: irc.MessageEvent, m: RegExpExecArray) => void): Bot;
    any(fn: (e: irc.MessageEvent) => void): Bot;
}

export class Bot {
    public client: irc.Client;
    private stacks = {};
    private cfg: BotConfig;

    constructor(client: irc.Client) {
        this.client = client;
        EVENTS.forEach(n => this.client.on(n, data => {
            if (!this.stacks[n]) return;
            this.run(data, this.stacks[n]);
        }));
    }

    say(target: string, msg: string): Bot {
        this.client.send(target, msg);
        return this;
    }

    reply(from: string, to: string, msg: string): Bot {
        const isPrivateMessage = to.toLowerCase() === this.cfg.nick.toLowerCase();
        const dest = isPrivateMessage ? from : to;
        this.client.send(dest, `${from}: ${msg}`);
        return this;
    }

    msg(pat: RegExp | Function, fn?: Function): Bot {
        if (typeof pat === 'Function') {
            fn = <Function>pat;
            pat = /.*/;
        }
        if (!this.stacks['message']) this.stacks['message'] = [];
        const handler = (e: irc.MessageEvent, next) => {
            if (e.to.toLowerCase() === this.cfg.nick.toLowerCase()) return next();
            if (!(<RegExp>pat).test(e.message)) return next();
            const m = (<RegExp>pat).exec(e.message);
            fn(e, m);
        };
        this.stacks['message'].push(handler);
        return this;
    }

    pm(pat: RegExp | Function, fn?: Function): Bot {
        if (typeof pat === 'Function') {
            fn = <Function>pat;
            pat = /.*/;
        }
        if (!this.stacks['message']) this.stacks['message'] = [];
        const handler = (e: irc.MessageEvent, next) => {
            if (e.to.toLowerCase() !== this.cfg.nick.toLowerCase()) return next();
            if (!(<RegExp>pat).test(e.message)) return next();
            const m = (<RegExp>pat).exec(e.message);
            fn(e, m);
        };
        this.stacks['message'].push(handler);
        return this;
    }

    any(pat: RegExp | Function, fn?: Function): Bot {
        if (typeof pat === 'Function') {
            fn = <Function>pat;
            pat = /.*/;
        }
        if (!this.stacks['message']) this.stacks['message'] = [];
        const handler = (e: irc.MessageEvent, next) => {
            if (!(<RegExp>pat).test(e.message)) return next();
            const m = (<RegExp>pat).exec(e.message);
            fn(e, m);
        };
        this.stacks['message'].push(handler);
        return this;
    }

    use(event: string, fn: Function) {
        if (!this.stacks[event]) this.stacks[event] = [];
        this.stacks[event].push(fn);
    }

    connect(cfg: BotConfig) {
        this.cfg = cfg;

        this.client.nick(cfg.nick);
        this.client.pass(cfg.password);
        this.client.user(cfg.username, cfg.user);
        this.client.join(cfg.channel);
    }

    private run(data: any, stack: Function[]) {
        let cont = false;
        let next = () => { cont = true };
        for (var i = 0; i < stack.length; i++) {
            cont = false;
            stack[i](data, next);
            if (!cont) break;
        }
    }
}