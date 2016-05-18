import irc = require('slate-irc');
import greetings = require('greetings');
import * as nano from './nanobot';

function greeter(channel: string, nick: string): nano.Middleware {
    return (client: irc.Client, data: nano.NamesEvent, next) => {
        const others = data.names
            .filter(x => x.name !== nick)
            .map(x => x.name);
        
        const to = others.length > 1 ? 'guys' : others[0]; 
        const msg = `${greetings()} ${to}!`;
        client.send(channel, msg);
    };
};