
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    const key = process.env.GEMINI_API_KEY;
    const modelName = 'gemini-flash-latest';
    console.log(`Testing Gemini API with model: ${modelName}`);

    if (!key) {
        console.log('GEMINI_API_KEY is missing');
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent('Say hello');
        const response = await result.response;
        console.log('SUCCESS:', response.text());
    } catch (e) {
        console.error('FAILED:', e.message);
    }
}

test();
