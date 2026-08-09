const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync('mentor/buku-saku.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => {
  console.error("JSDOM Error:", err);
});
virtualConsole.on("jsdomError", (err) => {
  console.error("JSDOM internal error:", err);
});
virtualConsole.on("log", (log) => {
  console.log("JSDOM Log:", log);
});

const dom = new JSDOM(html, { 
  runScripts: "dangerously",
  virtualConsole
});
setTimeout(() => {
    try {
        console.log("Calling selectGrade('X')");
        dom.window.selectGrade('X');
        console.log("Called selectGrade('X') successfully");
    } catch(e) {
        console.error("Error calling selectGrade:", e);
    }
}, 1000);
