const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('https://skycircle.id/mentor/buku-saku.html?v=3', {waitUntil: 'networkidle0'});
  console.log("Page loaded");
  
  try {
      await page.waitForSelector('button[onclick="exportClassProfiles(\\\'X\\\')"]');
      console.log("Found export button, clicking...");
      await page.click('button[onclick="exportClassProfiles(\\\'X\\\')"]');
      console.log("Clicked export button!");
      await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
      console.error("Puppeteer error:", e.toString());
  }
  
  await browser.close();
})();
