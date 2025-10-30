export const config = {
  runtime: 'edge',
};

// Define the CORS headers we want to send
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allows any domain to connect
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allows POST and OPTIONS requests
  'Access-Control-Allow-Headers': 'Content-Type', // Allows the 'Content-Type' header
};

// This is the main function that runs when you call the API
export default async function handler(request) {

  // --- 1. Handle OPTIONS (preflight) requests ---
  // The browser sends this *before* the POST request to check if it's allowed
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204, // No Content
      headers: corsHeaders, // Send back the "it's allowed" headers
    });
  }

  // --- 2. Handle POST requests (the actual chat message) ---
  if (request.method === 'POST') {
    try {
      const requestBody = await request.json();
      const userPrompt = requestBody.prompt;
      const chatHistory = requestBody.history || [];
      const boundary = requestBody.boundary;

      const GEMINI_KEY = process.env.GEMINI_API_KEY;

      const contents = chatHistory.map(turn => ({
        role: turn.role === 'bot' ? 'model' : 'user',
        parts: [{ text: turn.text }]
      }));

      contents.push({
        role: 'user',
        parts: [{ text: userPrompt }]
      });

      const dataForGoogle = {
        contents: contents,
      };

      if (boundary) {
        dataForGoogle.systemInstruction = {
          parts: [{ text: boundary }]
        };
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataForGoogle),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error ? errorData.error.message : "Error from Google API";
        
        // **Send error with CORS headers**
        return new Response(JSON.stringify({ error: errorMessage }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const responseData = await response.json();

      if (!responseData.candidates || responseData.candidates.length === 0) {
        // **Send error with CORS headers**
        return new Response(JSON.stringify({ error: "No response from AI (content may be blocked)." }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const aiReply = responseData.candidates[0].content.parts[0].text;

      // **Send success reply with CORS headers**
      return new Response(JSON.stringify({ reply: aiReply }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      // **Send internal error with CORS headers**
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // --- 3. Handle any other request methods (like GET) ---
  return new Response('Method Not Allowed', {
    status: 405,
    headers: corsHeaders,
  });
}