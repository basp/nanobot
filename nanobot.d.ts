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