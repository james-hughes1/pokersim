import axios from 'axios';

const cohereApiKey = process.env.REACT_APP_COHERE_API_KEY;  // Get the API key from environment variables

export const getCohereResponse = async (prompt) => {
  try {
    const response = await axios.post(
      'https://api.cohere.com/v2/chat',
      {
        stream: false,
        model: 'command-a-03-2025',  // Use the model you want
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${cohereApiKey}`,  // API key from the environment variables
          'Content-Type': 'application/json',
        },
      }
    );

    // Return the generated text
    return response.data.message.content[0].text;
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Something went wrong while fetching the response from Cohere API');
  }
};
