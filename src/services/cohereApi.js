import axios from 'axios';

const cohereApiKey = process.env.REACT_APP_COHERE_API_KEY;

// Log a message indicating whether the API key is found
if (cohereApiKey) {
    console.log('Cohere API key is found.');
  } else {
    console.log('Cohere API key is not found.');
  }

export const getCohereResponse = async (prompt) => {
  try {
    // Cohere API request
    const response = await axios.post(
        'https://api.cohere.com/v2/chat',
        {
            stream: false,
            model: 'command-a-03-2025',
            messages: [
              {
                role: 'user',
                content: prompt,  // your dynamic prompt goes here
              },
            ],
            response_format: {
              type: 'json_object',
              json_schema: {
                type: 'object',
                properties: {
                  action: { type: 'string' },
                  amount: { type: 'integer' },
                },
                required: ['action', 'amount'],
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${cohereApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

    // Return the generated text
    return response;
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Something went wrong while fetching the response from Cohere API');
  }
};
