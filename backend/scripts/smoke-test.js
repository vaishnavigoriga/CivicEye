const http = require('http');

async function testHealth() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:4000/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

console.log('Smoke test utility ready.');
