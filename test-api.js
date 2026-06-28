async function test() {
  const url = 'http://localhost:3000/api/analyze';
  console.log('Sending test request to ' + url + '...');
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'test', lang: 'fa' })
    });
    console.log('Status:', res.status);
    console.log('Headers:', res.headers);
    const text = await res.text();
    console.log('Body length:', text.length);
    console.log('Body preview:', text.substring(0, 200));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
