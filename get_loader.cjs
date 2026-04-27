const fs = require('fs');
const content = fs.readFileSync('public/static/js/bundle.js', 'utf8');

const loaderIdx = content.indexOf('const IntroLoader =');
if (loaderIdx !== -1) {
    const snippet = content.slice(loaderIdx, loaderIdx + 2000);
    console.log(snippet);
}

