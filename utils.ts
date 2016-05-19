import _ = require('lodash');

// I must be over-engineering here...
//
function others(aliases: string[], names: string[]): string[] {
    return names.filter(name => {
        return !_(aliases).some(alias => alias === name);
    });
}

function parseBool(s: string) {
    switch (s.toLowerCase()) {
        case 'true': return true;
        case '1': return true;
        default: return false;        
    }
}

export {
others,
parseBool
}