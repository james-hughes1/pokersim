import React, { useState } from 'react';
import { getCohereResponse } from '../services/cohereApi';

function LlmChatPage() {
  const [prompt, setPrompt] = useState('');
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return; // Don't proceed if the prompt is empty
    setLoading(true);

    try {
      // Call the API service to get the response
      const generatedText = await getCohereResponse(prompt);
      setResponseText(generatedText);  // Set the generated response
    } catch (error) {
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
