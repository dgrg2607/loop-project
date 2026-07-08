// Thin wrapper around OpenAI's REST API using Node's built-in fetch (Node 18+).
// If no OPENAI_API_KEY is configured, this returns null and callers fall back
// to a rule-based summary so the rest of the app keeps working without any
// paid API key.
async function generateAIText(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful customer feedback analyst. Be concise and specific.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('OpenAI request failed:', err.message);
    return null;
  }
}

module.exports = { generateAIText };
