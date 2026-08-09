const fs = require('fs');
const html = fs.readFileSync('mentor/buku-saku.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/g);
if (match && match.length > 0) {
    fs.writeFileSync('temp2.js', match[match.length - 1].replace(/<\/?script>/g, ''));
    try {
        require('child_process').execSync('node -c temp2.js', {stdio: 'inherit'});
        console.log('Linting passed!');
    } catch (e) {
        console.error('Linting failed');
    }
}
