// Runs automatically on every verified Netlify Forms submission (the file name is the trigger).
// Forwards the submission to the Google Apps Script attached to the client's
// "Fox Media Applications" sheet, which appends it as a row.
// The script URL lives in the SHEET_WEBHOOK_URL environment variable, not in the code.
//
// Why this exists: Apps Script answers a POST with a redirect, which Netlify's built-in
// outgoing webhook treats as a failure. fetch() follows it correctly.

exports.handler = async (event) => {
  const url = process.env.SHEET_WEBHOOK_URL;
  if (!url) {
    console.error('SHEET_WEBHOOK_URL is not set');
    return { statusCode: 200, body: 'no sheet url configured' };
  }
  try {
    const { payload } = JSON.parse(event.body || '{}');
    if (!payload || !payload.form_name) return { statusCode: 200, body: 'no payload' };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form_name: payload.form_name, created_at: payload.created_at, data: payload.data || {} }),
      redirect: 'follow',
    });
    const text = await res.text();
    console.log(`sheet responded ${res.status} for form "${payload.form_name}": ${text.slice(0, 120)}`);
    return { statusCode: 200, body: 'forwarded' };
  } catch (err) {
    console.error('forward to sheet failed:', err);
    return { statusCode: 200, body: 'error logged' };
  }
};
