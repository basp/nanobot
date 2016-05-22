import markov = require('markov');
import RSVP = require('rsvp');
import fs = require('fs');

function init(path: string, order = 2, cb?: (path: string) => void): RSVP.Promise<Markov> {
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

export {
init
}