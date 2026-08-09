const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  // We can load the local file to test it immediately instead of waiting for github pages!
  const htmlPath = 'file://' + process.cwd() + '/mentor/buku-saku.html';
  console.log("Loading", htmlPath);
  
  await page.goto(htmlPath, {waitUntil: 'networkidle0'});
  console.log("Page loaded");
  
  try {
      await page.waitForSelector('button[onclick="exportClassProfiles(\\\'X\\\')"]');
      console.log("Found export button, clicking...");
      await page.click('button[onclick="exportClassProfiles(\\\'X\\\')"]');
      console.log("Clicked export button!");
      await new Promise(r => setTimeout(r, 4000));
  } catch(e) {
      console.error("Puppeteer error:", e.toString());
  }
  
  await browser.close();
})();
