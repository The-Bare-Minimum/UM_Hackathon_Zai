// Final test with correct model
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testFinal() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log('Testing gemini-2.0-flash model...\n');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say "Hello from Gemini!"' }] }],
    });
    const text = result.response.text();
    console.log('✅ SUCCESS! Gemini responded:', text);
    console.log('\n✅ Your integration is working! Restart your Next.js dev server.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('\n⚠️  RATE LIMIT ISSUE:');
      console.log('   You have exceeded your Gemini API quota.');
      console.log('   Solutions:');
      console.log('   1. Wait a few minutes and try again (free tier has rate limits)');
      console.log('   2. Check your usage at: https://ai.dev/rate-limit');
      console.log('   3. Upgrade your plan at: https://aistudio.google.com/');
      console.log('\n   The code is correct - you just need to wait for the rate limit to reset.');
    }
  }
}

testFinal();
