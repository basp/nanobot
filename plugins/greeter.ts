import irc = require('slate-irc');
import greetings = require('greetings');
import _ = require('lodash');
import * as nano from '../nanobot';
import * as utils from '../utils';

function greeter(aliases: string[]): nano.Middleware {
    return (client: irc.Client, data: nano.NamesEvent, next) => {
        const names = data.names.map(x => x.name);
        const others = utils.others(aliases, names); 
        const to = others.length > 1 ? 'guys' : others[0];
        const msg = `${greetings()} ${to}!`;
        client.send(data.channel, msg);
    };
};

export {
greeter
}