// This tells Vercel this is a serverless function
export const config = {
  runtime: 'edge',
};

// This is the main function that runs when you call the API
export default async function handler(request) {
  try {
    // 1. Get the new, more complex data from the frontend
    const requestBody = await request.json();
    const userPrompt = requestBody.prompt;
    const chatHistory = requestBody.history || []; // Expects an array: [{ role: 'user', text: '...' }, { role: 'bot', text: '...' }]
    const boundary = requestBody.boundary;       // A simple string

    // 2. Get the *secret* API key from Vercel
    const GEMINI_KEY = process.env.GEMINI_API_KEY;

    // 3. Format the chat history for the Google API
    // Google expects "user" and "model" roles
    const contents = chatHistory.map(turn => ({
      role: turn.role === 'bot' ? 'model' : 'user', // Convert our 'bot' role to 'model'
      parts: [{ text: turn.text }]
    }));

    // 4. Add the new user prompt to the end of the history
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    // 5. Prepare the final data object to send to Google
    const dataForGoogle = {
      contents: contents,
    };

    // 6. Add the system prompt (boundary) *if* it was provided
    if (boundary) {
      dataForGoogle.systemInstruction = {
        parts: [{ text: boundary }]
      };
    }

    // 7. Send the request to the Google Gemini API
    const response = await fetch(
      // --- THIS IS THE FINAL CORRECTED LINE ---
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      // ----------------------------------------
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataForGoogle),
      }
    );

    if (!response.ok) {
      // If Google gives an error, send a clean error message back
      const errorData = await response.json();
      const errorMessage = errorData.error ? errorData.error.message : "Error from Google API";
      return new Response(JSON.stringify({ error: errorMessage }), { status: response.status });
    }

    const responseData = await response.json();

    // 8. Extract the AI's reply
    // Added a check in case the AI gives no response (e.g., safety block)
    if (!responseData.candidates || responseData.candidates.length === 0) {
      return new Response(JSON.stringify({ error: "No response from AI (content may be blocked)." }), { status: 500 });
    }
    
    const aiReply = responseData.candidates[0].content.parts[0].text;

    // 9. Send the clean reply back to our frontend
    return new Response(JSON.stringify({ reply: aiReply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // Catch any other errors
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}