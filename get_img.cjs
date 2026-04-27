const fs = require('fs');
const content = fs.readFileSync('public/static/js/bundle.js', 'utf8');

const matches = content.match(/<img[^>]*className:\s*"([^"]+)"[^>]*>/gi) || [];
// Let's just match objects that have 'img' and 'className' in react elements
const reactImgMatches = content.match(/_jsxDEV\("img",\s*\{[^}]*className:\s*"([^"]+)"/gi);
if (reactImgMatches) {
    console.log(reactImgMatches.join('\n'));
}

