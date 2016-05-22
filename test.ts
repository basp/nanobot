import levelup = require('levelup');
import _ = require('lodash');

const levelgraph = require('levelgraph');
const db = levelgraph(levelup('./db'));

const subject = 'the netherlands';

db.get({ limit: 100 }, (err, list) => {
    if (err) return console.error(err);
    let subjects = list.map(x => x.subject);
    subjects = _.uniq(subjects);
    subjects = _.shuffle(subjects);
    subjects = _.take(subjects, 5);
    console.log(subjects);
});