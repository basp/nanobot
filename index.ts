import fs = require('fs');
import net = require('net');
import irc = require('slate-irc');
import RSVP = require('rsvp');
import RiveScript = require('rivescript');
import markov = require('markov');
import greetings = require('greetings');
import levelup = require('levelup');
import S = require('string');
import _ = require('lodash');

import {Bot, NamesEvent} from './nanobot';
import {cfg} from './config';

const speak = require('speakeasy-nlp');
const levelgraph = require('levelgraph');

const db = levelgraph(levelup('./db'));

function initMarkov(path: string, order = 2, cb?: (path: string) => void): RSVP.Promise<Markov> {
    const s = fs.createReadStream(path);
    const m = markov(order);
    return new RSVP.Promise<Markov>((resolve, reject) => {
        m.seed(s, (err) => {
            if (err) return reject(err);
            if (cb) cb(path);
            resolve(m);
        });
    });
}

function initBrain(path: string, cb?: (path: string) => void): RSVP.Promise<RiveScript> {
    const brain = new RiveScript();
    return new RSVP.Promise<RiveScript>((resolve, reject) => {
        brain.loadDirectory(path,
            () => {
                brain.sortReplies();
                if (cb) cb(path);
                resolve(brain);
            },
            err => console.error(err));
    });
}

function logProgress(path: string): void {
    console.log(`Loaded ${path}`);
}

function markovRespond(r: Markov, msg: string): string {
    return r.respond(msg).map(x => x.trim()).join(' ');
}

function greet(people: string[]): string {
    const to = people.length > 1 ? 'guys' : people[0];
    return `${greetings()} ${to}!`;
}

function formalList(stuff: string[]) {
    if (stuff.length > 2) {
        const last = _.last(stuff);
        const xs = _.take(stuff, stuff.length - 1);
        return `${xs.join(', ')} and ${last}`;
    }

    if (stuff.length == 2) {
        return stuff.join(' and ');
    }

    return stuff[0];
}

const promises = {
    catstory: initMarkov('c:/temp/cat.txt', 4, logProgress),
    chat: initMarkov('c:/temp/chat-sanitized.log', 2, logProgress),
    plato: initMarkov('c:/temp/plato.txt', 3, logProgress),
    shakespeare: initMarkov('c:/temp/shakespeare.txt', 2, logProgress),
    brain: initBrain('./brains/default', logProgress)
};

RSVP.hash(promises).then(r => {
    const catstory: Markov = r.catstory;
    const chat: Markov = r.chat;
    const plato: Markov = r.plato;
    const shakespeare: Markov = r.shakespeare;
    const brain: RiveScript = r.brain;

    const sentiment = {};

    brain.setSubroutine('chat',
        (rs, args) => markovRespond(chat, args[0]));

    brain.setSubroutine('plato',
        (rs, args) => markovRespond(plato, args[0]));

    brain.setSubroutine('shakespeare',
        (rs, args) => markovRespond(shakespeare, args[0]));

    brain.setSubroutine('catstory',
        (rs, args) => markovRespond(catstory, args[0]));

    brain.setSubroutine('putTriple',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            const predicate = args[1];
            const object = args[2];
            const triple = { subject, predicate, object };
            db.put(triple, err => {
                if (err) return reject(err);
                var msg = JSON.stringify(triple);
                return resolve(msg);
            });
        }));

    brain.setSubroutine('location',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            const predicate = 'location';
            db.get({ subject, predicate, limit: 10 }, (err, list) => {
                if (err) return reject(err);
                const locations = list.map(x => x.object);
                if (locations.length === 0) {
                    return resolve(`Sadly I have no knowledge of the whereabouts of ${args[0]}.`);
                }

                const reply = `Known locations of ${args[0]} are: ${formalList(locations)}`;
                return resolve(reply);
            });
        }));

    brain.setSubroutine('forget',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            const predicate = args[1];
            const object = args[2];
            const triple = { subject, predicate, object };
            db.del(triple, err => {
                if (err) return reject(err);
                return resolve('OK!');
            });
        }));

    brain.setSubroutine('about',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            db.get({ subject }, (err, list) => {
                if (err) return reject(err);
                if (list.length === 0) {
                    return resolve(`Sadly I know nothing about ${subject}.`);
                }

                const t: any = _(list).shuffle().first();
                const msg = `${t.subject} ${t.predicate} ${t.object}.`;
                return resolve(S(msg).capitalize());
            });
        }));

    brain.setSubroutine('subjects',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const count = +(args[0]);
            db.get({ limit: 100 }, (err, list) => {
                if (err) return reject(err);
                let subjects = list.map(x => x.subject);
                subjects = _.uniq(subjects);
                subjects = _.shuffle(subjects);
                subjects = _.take(subjects, count);
                return resolve(formalList(subjects));
            })
        }));

    brain.setSubroutine('types',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            const predicate = 'is_a';
            db.get({ subject, predicate }, (err, list) => {
                if (err) return reject(err);
                return resolve(JSON.stringify(list));
            });
        }));

    brain.setSubroutine('aboutKind',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            const subject = args[0];
            const predicate = 'is_a';
            db.get({ subject, predicate, limit: 5 }, (err, list) => {
                if (err) return reject(err);
                if (list.length === 0) {
                    return resolve(`I don't know enough about ${subject} yet. Try telling me more!`);
                }
            
                const index = Math.floor(Math.random() * list.length);
                const answer = list[index];
                const reply = `${answer.subject} is a ${answer.object}.`;    
                return resolve(reply);
            });
        }));

    brain.setSubroutine('sentiment',
        (rs, args) => new RSVP.Promise((resolve, reject) => {
            return resolve(JSON.stringify(sentiment));
        }));

    const stream = net.connect({
        port: 6667,
        host: 'irc.freenode.org'
    });

    const client = irc(stream);
    const bot = new Bot(client);

    bot.use('data', data => {
        console.log(data);
    });

    bot.use('names', (e: NamesEvent, next) => {
        const others = e.names
            .filter(x => x.name !== cfg.nick)
            .map(x => x.name);

        bot.say(cfg.channel, greet(others));
    });

    bot.use('message', (e: irc.MessageEvent, next) => {
        const c = speak.classify(e.message);
        const s = speak.sentiment.analyze(e.message);
        if (!sentiment[e.from]) sentiment[e.from] = 0;
        sentiment[e.from] += s.score;
        next();
    });

    bot.msg(/^.*(meth|methbot)[\,\s]+(.*)$/i, (e: irc.MessageEvent, m) => {
        const msg = m[2];
        brain.replyAsync(e.from, msg, this, (err, reply) => {
            if (err) return console.error(err);
            bot.say(cfg.channel, reply);
        });
    });

    bot.msg(/^(.*)[\,\s]+(meth|methbot).*$/i, (e: irc.MessageEvent, m) => {
        const msg = m[1];
        brain.replyAsync(e.from, msg, this, (err, reply) => {
            if (err) return console.error(err);
            bot.say(cfg.channel, reply);
        });
    });

    bot.msg(/^(.*)\?/, (e: irc.MessageEvent, m) => {
        const CHANCE = 0.65, r = Math.random();
        if (r > CHANCE) return;
        const msg = m[1];
        brain.replyAsync(e.from, msg, this, (err, reply) => {
            if (err) return console.error(err);
            bot.say(cfg.channel, reply);
        });
    });

    bot.msg(/^(.*)\!/, (e: irc.MessageEvent, m) => {
        const CHANCE = 0.5, r = Math.random();
        if (r > CHANCE) return;
        const msg = m[1];
        brain.replyAsync(e.from, msg, this, (err, reply) => {
            if (err) return console.error(err);
            bot.say(cfg.channel, reply);
        });
    });

    bot.connect(cfg);
});