'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';
/* eslint-disable @typescript-eslint/no-require-imports */
const pdf = require('pdf-parse/lib/pdf-parse.js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-flash-latest';

// On Vercel, the filesystem is read-only except for /tmp
const IS_VERCEL = process.env.VERCEL === '1';
const CACHE_DIR = IS_VERCEL
    ? path.join('/tmp', 'ai-cache')
    : path.join(process.cwd(), 'src', 'data', 'ai-cache');

async function ensureCacheDir() {
    try {
        await fs.access(CACHE_DIR);
    } catch {
        await fs.mkdir(CACHE_DIR, { recursive: true });
    }
}

function getCacheKey(mode: string, page?: number, end?: number) {
    if (mode === 'page') return `page_${page}`;
    if (mode === 'chapter') return `chapter_${page}_${end}`;
    return 'full';
}

async function getCachedData(bookId: string, type: string, key: string) {
    try {
        const cacheFile = path.join(CACHE_DIR, `${bookId.replace(/\.pdf$/i, '')}.json`);
        const content = await fs.readFile(cacheFile, 'utf-8');
        const cache = JSON.parse(content);
        return cache[type]?.[key] || null;
    } catch {
        return null;
    }
}

async function saveCachedData(bookId: string, type: string, key: string, data: any) {
    try {
        await ensureCacheDir();
        const bookKey = bookId.replace(/\.pdf$/i, '');
        const cacheFile = path.join(CACHE_DIR, `${bookKey}.json`);
        let cache: any = {};
        try {
            const content = await fs.readFile(cacheFile, 'utf-8');
            cache = JSON.parse(content);
        } catch { }

        if (!cache[type]) cache[type] = {};
        cache[type][key] = data;
        await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
    } catch (e) {
        // Silently fail caching on Vercel or other restricted environments
        console.warn('Failed to save to cache (expected on some cloud environments):', e);
    }
}

/**
 * Robustly parses JSON from LLM responses, handling markdown fences and surrounding text.
 */
function parseJSONResponse(text: string, type: 'array' | 'object'): any {
    let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn(`Initial JSON parse failed for ${type}, attempting regex extraction...`);
        const regex = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
        const match = cleaned.match(regex);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch (innerE) {
                console.error(`Regex JSON extraction failed for ${type}:`, innerE);
            }
        }
        throw new Error(`Failed to parse ${type} from AI response: ${text.slice(0, 100)}...`);
    }
}

async function getTextFromPDF(bookFilename: string, pageNumber?: number, endPage?: number): Promise<string> {
    try {
        const jsonFilename = bookFilename.replace(/\.pdf$/i, '.json');
        const jsonPath = path.join(process.cwd(), 'public', 'books', jsonFilename);
        const jsonContent = await fs.readFile(jsonPath, 'utf-8');
        const bookData = JSON.parse(jsonContent);

        if (pageNumber !== undefined) {
            const pages = bookData.pages;
            if (endPage !== undefined) {
                let rangeText = '';
                for (let i = pageNumber; i <= endPage; i++) {
                    const page = pages.find((p: any) => p.pageNumber === i);
                    if (page) rangeText += page.content + '\n\n';
                }
                return rangeText;
            }
            const page = pages.find((p: any) => p.pageNumber === pageNumber);
            return page ? page.content : '';
        }
        return bookData.pages.map((p: any) => p.content).join('\n\n');
    } catch (e) {
        console.log(`JSON for ${bookFilename} not found, falling back to PDF.`);
    }

    try {
        const filePath = path.join(process.cwd(), 'public', 'books', bookFilename);
        const dataBuffer = await fs.readFile(filePath);
        if (pageNumber !== undefined) {
            const pageTexts: string[] = [];
            const options = {
                pagerender: async function (pageData: any) {
                    const textContent = await pageData.getTextContent();
                    let lastY, text = '';
                    for (const item of textContent.items) {
                        if (lastY == item.transform[5] || !lastY) text += item.str;
                        else text += '\n' + item.str;
                        lastY = item.transform[5];
                    }
                    pageTexts[pageData.pageIndex] = text;
                    return text;
                }
            };
            await pdf(dataBuffer, options);
            if (endPage !== undefined) {
                let rangeText = '';
                for (let i = pageNumber - 1; i < endPage; i++) {
                    if (pageTexts[i]) rangeText += pageTexts[i] + '\n\n';
                }
                return rangeText;
            }
            return pageTexts[pageNumber - 1] || '';
        }
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error: any) {
        console.error('Error reading PDF:', error);
        throw new Error(`Failed to read book content: ${error.message}`);
    }
}

export async function getSummary(bookFilename: string, mode: 'full' | 'page' | 'chapter' = 'full', pageNumber?: number, endPage?: number) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing');
        return 'Configuration Error: AI API Key is not set.';
    }

    const cacheKey = getCacheKey(mode, pageNumber, endPage);
    const cached = await getCachedData(bookFilename, 'summary', cacheKey);
    if (cached) return cached;

    try {
        const text = await getTextFromPDF(bookFilename, pageNumber, endPage);
        const slicedText = text.slice(0, 60000);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        let promptContext = "summary of the following text";
        if (mode === 'page') promptContext = `summary of page ${pageNumber}`;
        if (mode === 'chapter') promptContext = `summary of pages ${pageNumber}-${endPage}`;
        const prompt = `You are an expert tutor. Provide a ${promptContext}. Focus on key learning objectives. Format with Markdown. \n\nText:\n${slicedText}`;
        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        await saveCachedData(bookFilename, 'summary', cacheKey, summary);
        return summary;
    } catch (error: any) {
        console.error('Summary error details:', error);
        return `Failed to generate summary: ${error.message || 'Unknown error'}. Check server logs or API key.`;
    }
}

export async function getQuiz(bookFilename: string, mode: 'full' | 'page' | 'chapter' = 'full', pageNumber?: number, endPage?: number) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing');
        return [];
    }

    const cacheKey = getCacheKey(mode, pageNumber, endPage);
    const cached = await getCachedData(bookFilename, 'quiz', cacheKey);
    if (cached) return cached;

    try {
        const text = await getTextFromPDF(bookFilename, pageNumber, endPage);
        const slicedText = text.slice(0, 60000);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Generate 5 MCQs based on this text. Return raw JSON array: [{"question": "...", "options": ["...", "..."], "answer": "..."}].\n\nText:\n${slicedText}`;
        const result = await model.generateContent(prompt);
        const quiz = parseJSONResponse(result.response.text(), 'array');
        await saveCachedData(bookFilename, 'quiz', cacheKey, quiz);
        return quiz;
    } catch (error) {
        console.error('Quiz error:', error);
        return [];
    }
}

export async function getMindMap(bookFilename: string, mode: 'full' | 'page' | 'chapter' = 'full', pageNumber?: number, endPage?: number) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing');
        return { nodes: [], edges: [] };
    }

    const cacheKey = getCacheKey(mode, pageNumber, endPage);
    const cached = await getCachedData(bookFilename, 'mindmap', cacheKey);
    if (cached) return cached;

    try {
        const text = await getTextFromPDF(bookFilename, pageNumber, endPage);
        const slicedText = text.slice(0, 60000);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Create a hierarchical mind map JSON: {"nodes": [{"id": "1", "label": "...", "type": "input"}], "edges": [{"id": "e1-2", "source": "1", "target": "2"}]}.\n\nText:\n${slicedText}`;
        const result = await model.generateContent(prompt);
        const mindmap = parseJSONResponse(result.response.text(), 'object');
        await saveCachedData(bookFilename, 'mindmap', cacheKey, mindmap);
        return mindmap;
    } catch (error) {
        console.error('MindMap error:', error);
        return { nodes: [], edges: [] };
    }
}

export async function getInfographic(bookFilename: string, mode: 'full' | 'page' | 'chapter' = 'full', pageNumber?: number, endPage?: number) {
    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing');
        return [];
    }

    const cacheKey = getCacheKey(mode, pageNumber, endPage);
    const cached = await getCachedData(bookFilename, 'infographic', cacheKey);
    if (cached) return cached;

    try {
        const text = await getTextFromPDF(bookFilename, pageNumber, endPage);
        const slicedText = text.slice(0, 60000);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        const prompt = `Identify 5-7 key concepts for an infographic. Return JSON array: [{"title": "...", "description": "...", "icon": "Box"}].\n\nText:\n${slicedText}`;
        const result = await model.generateContent(prompt);
        const infographic = parseJSONResponse(result.response.text(), 'array');
        await saveCachedData(bookFilename, 'infographic', cacheKey, infographic);
        return infographic;
    } catch (error) {
        console.error('Infographic error:', error);
        return [];
    }
}
export async function getPodcast(bookFilename: string) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'books', bookFilename);
        const outputFilename = `${bookFilename.replace(/\.pdf$/i, '')}-${Date.now()}.mp3`;
        const outputPath = path.join(process.cwd(), 'public', 'podcasts', outputFilename);

        const { spawn } = await import('child_process');

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                path.join(process.cwd(), 'scripts', 'generate-podcast.py'),
                filePath,
                outputPath
            ]);

            pythonProcess.stdout.on('data', (data) => {
                console.log(`Python stdout: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error(`Python stderr: ${data}`);
            });

            pythonProcess.on('error', (err) => {
                console.error('Failed to start python process:', err);
                reject(new Error('Python environment not found. Podcast generation is currently unavailable on this platform.'));
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(`/podcasts/${outputFilename}`);
                } else {
                    reject(new Error(`Python script exited with code ${code}`));
                }
            });
        });
    } catch (error) {
        console.error('Podcast error:', error);
        throw new Error('Failed to generate podcast.');
    }
}
