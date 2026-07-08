const fs = require('fs');

try {
  const code = fs.readFileSync('f:/temp-google-sheet-tool/temp-google-sheet-tool/SCRIPT_9_HOTMAIL_READ.txt', 'utf8');
  // Sử dụng eval hoặc Function constructor để kiểm tra cú pháp
  new Function(code);
  console.log('Syntax OK!');
} catch (err) {
  console.error('Syntax Error:', err.message, err.stack);
}
