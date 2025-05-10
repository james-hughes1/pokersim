import React, { useState } from 'react';
import axios from 'axios';

function LlmChatPage() {
  const [prompt, setPrompt] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
  
    try {
      if (process.env.NODE_ENV === 'development') {
        // LOCAL DEVELOPMENT: call Cohere API directly
        const cohereApiKey = process.env.REACT_APP_COHERE_API_KEY;
  
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
        setResponseText(response.data.message.content[0].text);
      } else {
        // PRODUCTION: call your own backend API
        const response = await axios.post('/api/generate', { prompt });
        setResponseText(response.data.text);
      }
    } catch (error) {
      console.error('Error generating text:', error);
      setResponseText('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Talk to Poker Simulator AI</h1>

      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message..."
        className="border p-2 w-full max-w-md mb-4 rounded"
      />

      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>

      {responseText && (
        <div className="mt-6 p-4 border rounded max-w-md w-full">
          <h2 className="font-bold mb-2">AI says:</h2>
          <p>{responseText}</p>
        </div>
      )}
    </div>
  );
}

export default LlmChatPage;
