// Test gemini-1.5-flash model
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log('Testing gemini-1.5-flash model...\n');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('Say "Hello from Gemini 1.5 Flash!"');
    const text = result.response.text();
    console.log('✅ SUCCESS! Gemini responded:', text);
    console.log('\n✅ Your integration is working! Restart your Next.js dev server.');
  } catch (error) {
    console.error('❌ Error:', error.message.split('\n')[0]);
    
    if (error.message.includes('429') || error.message.includes('quota')) {
      console.log('\n⚠️  Still hitting rate limits. Please wait a few minutes.');
    } else if (error.message.includes('404')) {
      console.log('\n⚠️  Model not found. Trying gemini-pro instead...');
    }
  }
}

test();
