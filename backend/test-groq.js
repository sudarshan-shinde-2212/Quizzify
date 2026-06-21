const Groq = require('groq-sdk');
require('dotenv').config();

async function main() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello' }],
      model: 'llama3-8b-8192',
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch (err) {
    console.error("Groq Error:", err.message);
  }
}

main();
