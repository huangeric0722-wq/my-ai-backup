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
    console.log('Navigating to example.com...');
    await page.goto('http://example.com');
    await page.screenshot({ path: 'example.png' });
    await page.close();
    await browser.disconnect();
    console.log('Done: example.png');
  } catch (err) {
    console.error(err);
  }
})();
