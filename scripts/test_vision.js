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
  console.log(`Fetching version from ${browserUrl}...`);
  try {
    const version = await getVersion();
    let wsUrl = version.webSocketDebuggerUrl;
    
    const wsEndpointPath = wsUrl.split('/devtools/')[1];
    const finalWsUrl = `ws://${browserHost}:${browserPort}/devtools/${wsEndpointPath}`;
    
    console.log('Fixed WS URL:', finalWsUrl);

    const browser = await puppeteer.connect({
      browserWSEndpoint: finalWsUrl,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('Navigating to Yahoo TW...');
    try {
        // Reduced timeout, wait until domcontentloaded (faster than networkidle2)
        await page.goto('https://www.yahoo.com.tw', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
        console.log('Navigation timeout or error (continuing to screenshot anyway):', e.message);
    }
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'yahoo_tw.png' });
    
    await page.close();
    await browser.disconnect();
    console.log('Done: yahoo_tw.png');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
