import moment = require('moment');
import irc = require('slate-irc');
import * as nano from './nanobot';

export function command(nick: string): nano.Middleware  {
    return (client, data: irc.MessageEvent, next) => {        
        if (data.to.toLowerCase() !== nick.toLowerCase()) return;
        const chunks = data.message.split(' ')
            .map(x => x.trim())
            .filter(x => x.length > 0);
        
        console.log(chunks);
    }
}