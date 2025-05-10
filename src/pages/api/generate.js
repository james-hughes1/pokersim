// /api/generate.js

export default async function handler(req, res) {
  // Check if the request is a POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Get the API key securely from environment variables
  const cohereApiKey = process.env.COHERE_API_KEY;

  if (cohereApiKey) {
    console.log('Cohere API key is found.');
  } else {
    console.log('Cohere API key is not found.');
  }

  try {
    const response = await fetch('https://api.cohere.com/v2/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cohereApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command-a-03-2025',
        messages: [{ role: 'user', content: req.body.prompt }],
      }),
    });

    const data = await response.json();

    // Send the response from Cohere back to the client
    res.status(200).json(data);
  } catch (error) {
    console.error('Error calling Cohere API:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}
