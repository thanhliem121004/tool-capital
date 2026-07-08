async function main() {
  const res = await fetch('http://localhost:3001/api/read-rows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sheetId: '1u976gsls9ysmeVocrrzuFJZBOGAU6vTKFVE7H8w2WJE',
      sheetName: 'Sheet1',
      mode: 'capital_reg'
    })
  });
  const data = await res.json();
  console.log('API success:', data.success);
  if (data.success) {
    console.log('First row parsed:', JSON.stringify(data.rows[0], null, 2));
  } else {
    console.error('API Error:', data.error);
  }
}

main().catch(console.error);
