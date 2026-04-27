const fs = require('fs');
const content = fs.readFileSync('public/static/js/bundle.js', 'utf8');

// Match img tags or elements with image classes
const imgMatches = content.match(/.{0,50}img.{0,50}/gi);
if (imgMatches) {
    console.log("Found img references:");
    console.log(imgMatches.slice(0, 20).join('\n'));
}

const classNameMatches = content.match(/className:\s*"([^"]*(?:image|img|profile|avatar|hero)[^"]*)"/gi);
if (classNameMatches) {
    console.log("\nFound className references:");
    console.log(classNameMatches.slice(0, 20).join('\n'));
}

