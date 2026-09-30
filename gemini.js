// This file runs on Vercel's servers, never in the visitor's browser.
// Your Gemini API key stays secret here — it is never sent to the website.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { question, phaseInfo, cycleLength } = req.body || {};
  if (!question || typeof question !== "string") {
    res.status(400).json({ error: "Missing question" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  const prompt =
    "You are Bloom, a warm, knowledgeable PCOD/PCOS lifestyle companion inside a period-tracking app. " +
    "Answer the user's question in under 90 words: practical, empathetic, and specific to PCOD where relevant. " +
    "You are not a doctor and must not diagnose — gently suggest seeing a doctor for anything medical. " +
    `Context: the user's average cycle length is about ${cycleLength || "unknown"} days, ` +
    `and their app currently shows: "${phaseInfo || "unknown phase"}". ` +
    `User question: ${question}`;

  try {
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await geminiResp.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a reply just now — please try again.";

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Gemini request failed" });
  }
};
