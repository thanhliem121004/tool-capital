const http = require('http');

function testPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/active-reg-data`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Port ${port} success:`, data);
        resolve(true);
      });
    });
    req.on('error', (err) => {
      console.log(`Port ${port} error:`, err.message);
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      console.log(`Port ${port} timeout`);
      resolve(false);
    });
  });
}

async function run() {
  console.log('Testing ports 3000 and 3001...');
  await testPort(3000);
  await testPort(3001);
}

run();
