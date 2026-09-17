// Vercel serverless function — proxies CallRail requests server-side
// so the browser never talks to api.callrail.com directly (avoids CORS entirely).
// The CallRail key lives here as an env var, never shipped to the browser.

export default async function handler(req, res) {
  const CR_KEY = process.env.CALLRAIL_TOKEN || process.env.CALLRAIL_API_KEY;
  if (!CR_KEY) {
    return res.status(500).json({ error: 'CALLRAIL_TOKEN not set in Vercel env vars' });
  }

  const { path, ...query } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query param' });
  }

  const params = new URLSearchParams(query).toString();
  const url = `https://api.callrail.com/v3/${path}${params ? '?' + params : ''}`;

  try {
    const crRes = await fetch(url, {
      headers: { Authorization: `Token token=${CR_KEY}` }
    });
    const body = await crRes.text();
    res.status(crRes.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(body);
  } catch (err) {
    return res.status(502).json({ error: 'Proxy fetch failed', detail: String(err) });
  }
}
