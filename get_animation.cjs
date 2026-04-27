const fs = require('fs');
const content = fs.readFileSync('public/static/js/bundle.js', 'utf8');

const matches = content.match(/className:\s*"([^"]*(?:animate-)[^"]*)"/gi);
if (matches) {
    console.log(matches.join('\n'));
}

