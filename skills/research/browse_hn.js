const puppeteer = require('puppeteer-core');
const http = require('http');

const browserHost = 'openclaw-sandbox-browser.zeabur.internal';
const browserPort = 9222;
const browserUrl = `http://${browserHost}:${browserPort}`;

function getVersion() {
  return new Promise((resolve, reject) => {
    http.get(`${browserUrl}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    const version = await getVersion();
    let wsUrl = version.webSocketDebuggerUrl;
    const wsEndpointPath = wsUrl.split('/devtools/')[1];
    const finalWsUrl = `ws://${browserHost}:${browserPort}/devtools/${wsEndpointPath}`;
    
    const browser = await puppeteer.connect({ browserWSEndpoint: finalWsUrl });
    const page = await browser.newPage();
    
    console.log('Navigating to Hacker News...');
    await page.goto('https://news.ycombinator.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Extract top stories
    const stories = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.athing'));
      return rows.slice(0, 5).map(row => {
        const link = row.querySelector('.titleline > a');
        return {
          title: link ? link.innerText : 'No Title',
          url: link ? link.href : '#',
          id: row.id
        };
      });
    });

    console.log(JSON.stringify(stories, null, 2));
    
    await page.close();
    await browser.disconnect();
  } catch (err) {
    console.error(err);
  }
})();
