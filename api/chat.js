// This tells Vercel this is a serverless function
export const config = {
  runtime: 'edge',
};

// This is the main function that runs when you call the API
export default async function handler(request) {
  // 1. Get the data from the frontend (the user's question)
  // We expect a JSON object like: { "prompt": "Hello" }
  const requestBody = await request.json();
  const userPrompt = requestBody.prompt;

  // 2. Get the *secret* API key from Vercel's environment variables
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  // 3. Prepare the data to send to Google
  const dataForGoogle = {
    contents: [
      {
        parts: [{ text: userPrompt }],
      },
    ],
  };

  try {
    // 4. Send the request to the Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataForGoogle),
      }
    );

    if (!response.ok) {
      // If Google gives an error, send it back to our frontend
      const error = await response.text();
      return new Response(JSON.stringify({ error: error }), { status: 500 });
    }

    const responseData = await response.json();

    // 5. Extract the AI's reply from the full response
    const aiReply = responseData.candidates[0].content.parts[0].text;

    // 6. Send the clean reply back to our frontend
    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Catch any other errors (like network issues)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}