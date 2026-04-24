// Test different Gemini model names
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
];

async function testModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Say "OK"' }] }],
    });
    const text = result.response.text();
    console.log(`✅ ${modelName}: WORKS (response: ${text.trim()})`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function findWorkingModel() {
  console.log('Testing Gemini models...\n');
  
  for (const modelName of modelsToTry) {
    const works = await testModel(modelName);
    if (works) {
      console.log(`\n✅ Recommended model: ${modelName}`);
      break;
    }
  }
}

findWorkingModel();
