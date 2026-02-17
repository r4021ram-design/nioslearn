
import { getSummary, getQuiz, getMindMap, getInfographic } from '../src/app/actions';

import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function test() {
    const book = '311_E_book1.pdf';
    console.log(`Testing AI actions for ${book}...`);
    console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'Present' : 'Missing'}`);

    try {
        console.log('\n--- Testing Summary ---');
        const summary = await getSummary(book, 'page', 100);
        console.log('Summary Result:', summary.slice(0, 100) + '...');

        console.log('\n--- Testing Quiz ---');
        const quiz = await getQuiz(book, 'page', 100);
        console.log('Quiz Result (count):', Array.isArray(quiz) ? quiz.length : 'Error');

        console.log('\n--- Testing Mind Map ---');
        const mindMap = await getMindMap(book, 'page', 100);
        console.log('Mind Map Result (nodes):', mindMap?.nodes?.length || 0);

        console.log('\n--- Testing Infographic ---');
        const infographic = await getInfographic(book, 'page', 100);
        console.log('Infographic Result (count):', Array.isArray(infographic) ? infographic.length : 'Error');

    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
