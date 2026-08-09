const fs = require('fs');
let content = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const target = `            renderHTML(safeProfileSrc, bgImageUrl);
        }
    }
}

    function showToast(msg) {`;

const replacement = `            renderHTML(safeProfileSrc, bgImageUrl);
        }
    }

    function showToast(msg) {`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('mentor/buku-saku.html', content, 'utf8');
    console.log("Extra brace removed.");
} else {
    console.log("Could not find the target to remove the brace.");
}
