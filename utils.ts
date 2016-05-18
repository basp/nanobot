import _ = require('lodash');

// I must be over-engineering here...
//
function others(aliases: string[], names: string[]): string[] {
    return names.filter(name => {
        return !_(aliases).some(alias => alias === name);
    });
}

export {
others
}