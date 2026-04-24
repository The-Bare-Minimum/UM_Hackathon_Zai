// Quick test script to verify Gemini API key works
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('Testing Gemini API...');
  console.log('API Key present:', apiKey ? 'Yes' : 'No');
  console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
  
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    process.exit(1);
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    console.log('\nSending test request to Gemini...');
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say "Hello, I am working!" in exactly those words.' }] }],
    });
    
    const response = result.response;
    const text = response.text();
    
    console.log('✅ Success! Gemini responded with:', text);
    console.log('\n✅ Your Gemini API key is working correctly!');
    console.log('Please restart your Next.js dev server to pick up the environment variable.');
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error.message);
    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n⚠️  Your API key appears to be invalid. Please check:');
      console.error('   1. The key is correct in .env.local');
      console.error('   2. Get a new key from: https://aistudio.google.com/app/apikey');
    }
  }
}

testGemini();
