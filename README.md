I built a flexible, serverless AI engine that can power any number of applications.
I created a central API endpoint on Vercel that securely handles all communication with the Gemini AI.

The project was more than just a single chatbot; it was an exercise in building a reusable, secure, and scalable AI backend. I call it my 'AI Engine'.

1. The Problem I Solved: "I wanted to build multiple AI applications—like a website chatbot, a Discord bot, etc.—but I faced three main problems:

Security: I couldn't put my secret Google AI key in my website's code, or anyone could steal it.

Duplication: I didn't want to copy and paste the same AI logic into every new project.

Cost: I wanted a solution that could scale up without costing me any money for personal use."

2. My Architectural Solution: "My solution was to build a decoupled, serverless architecture using Vercel.

The Backend: I created a single serverless function (/api/chat.js) on Vercel. This function is the "engine." It's the only part of my system that knows the secret API key,
which is securely stored in Vercel's Environment Variables.

The API: This engine exposes its own simple API. It's designed to receive a user's prompt, their chat_history, and a special boundary (a system prompt).

3. The Benefits of This Design:

Secure: My main API key is completely locked down.

Configurable: I can change the AI's entire personality from the frontend just by sending a different boundary string.

Reusable: I can build 100 new websites or bots, and they can all use the same central engine, which I only have to update in one place.

Scalable & Free: By using serverless functions, the project costs nothing to run, but it can handle thousands of requests without any issues."



ORS (Cross-Origin Resource Sharing) (you had to fix this to allow your website to call your API)

Scalable (handles traffic automatically)
