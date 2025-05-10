// src/pages/api/generate.js
import axios from 'axios';

export default async function handler(req, res) {
  // Ensure the request is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the prompt from the body
  const { prompt } = req.body;

  // Check if prompt is provided
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  try {
    // Get API key from environment variables
    const cohereApiKey = process.env.COHERE_API_KEY || process.env.REACT_APP_COHERE_API_KEY;

    // Check if API key is available
    if (!cohereApiKey) {
      console.error('API key is missing');
      return res.status(500).json({ error: 'API key missing' });
    }

    // Make the API request to Cohere
    const response = await axios.post(
      'https://api.cohere.com/v2/chat',
      {
        stream: false,
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Get the generated response text from Cohere API
    const generatedText = response.data.message.content[0].text;

    // Send the response back to the frontend
    res.status(200).json({ text: generatedText });
  } catch (error) {
    console.error('Error generating text:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate text' });
  }
}
