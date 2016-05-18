import irc = require('slate-irc');

declare module "slate-irc" {
    interface Client {
        on(event: 'names', callback: (e: NamesEvent) => void);
    }
}

export interface NamesEvent {
    channel: string;
    names: { name: string, mode: string }[];
}

export type NextFunc = () => void;
export type Middleware = (client: irc.Client, data: any, next: NextFunc) => void;
export type Stack = Middleware[];

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

export class Bot {
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
            stack[i](this.client, data, next);
            if (!cont) break;
        }
    }
}