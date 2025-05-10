// /api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Get the API key: Try Vercel environment first, fallback to React local env
  const cohereApiKey = process.env.COHERE_API_KEY;

  if (!cohereApiKey) {
    return res.status(500).json({ error: 'Cohere API key not found' });
  }

  try {
    const response = await axios.post(
      'https://api.cohere.com/v2/chat',
      {
        stream: false,
        model: 'command-a-03-2025',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ text: response.data.message.content[0].text });
  } catch (error) {
    console.error('Error contacting Cohere:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate text' });
  }
}
