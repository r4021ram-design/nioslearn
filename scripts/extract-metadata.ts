import fs from 'fs';
import path from 'path';

const booksDir = path.join(process.cwd(), 'public', 'books');
const outputFile = path.join(process.cwd(), 'scripts', 'book-metadata.json');

interface BookPage {
    pageNumber: number;
    content: string;
}

interface BookJson {
    id: string;
    sourcePdf: string;
    totalPages: number;
    pages: BookPage[];
}

interface Chapter {
    title: string;
    module?: string;
    startPage: number;
    endPage?: number;
}

interface BookMetadata {
    bookId: string;
    chapters: Chapter[];
}

function cleanTitle(title: string): string {
    return title.replace(/[\.\s\d-]+$/, '').trim();
}

function extractChapters(book: BookJson): Chapter[] {
    const chapters: Chapter[] = [];

    const chapterPatterns = [
        /^\s*(\d+)\.?\s*(.+?)(?:[\s\.]+|(?<=[a-zA-Z])(?=\d))(\d+)(?:\s*[-–]\s*\d+)?\s*$/,
        /^\s*(?:Lesson|LESSON)\s*[-–]?\s*(\d+)\s*[:\.]?\s*(.+?)(?:[\s\.]+|(?<=[a-zA-Z])(?=\d))(\d+)(?:\s*[-–]\s*\d+)?\s*$/i
    ];

    const modulePattern = /^\s*Module\s*[-–]?\s*([0-9IVX]+)\s*[:\.]?\s*(.+?)\s*$/i;

    let candidatePages: BookPage[] = [];
    for (let i = 0; i < Math.min(40, book.pages.length); i++) {
        if (/CONTENTS|INDEX|TABLE OF CONTENTS|SYLLABUS|COURSE OVERVIEW/i.test(book.pages[i].content)) {
            candidatePages.push(book.pages[i]);
        }
    }

    if (candidatePages.length === 0) {
        console.log(`[${book.id}] No TOC keywords found.`);
    }

    let bestTocEntries: { lesson: number, title: string, printedStartPage: number, module?: string }[] = [];

    for (const page of candidatePages) {
        const pagesToScan = [page];
        const nextPageIndex = book.pages.findIndex(p => p.pageNumber === page.pageNumber + 1);
        if (nextPageIndex !== -1) pagesToScan.push(book.pages[nextPageIndex]);

        let currentEntries: { lesson: number, title: string, printedStartPage: number, module?: string }[] = [];
        let currentModule: string | undefined = undefined;

        for (const p of pagesToScan) {
            const lines = p.content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i].trim();
                if (!line) continue;
                const moduleMatch = modulePattern.exec(line);
                if (moduleMatch) {
                    currentModule = `Module ${moduleMatch[1]}: ${cleanTitle(moduleMatch[2])}`;
                    continue;
                }
                for (const regex of chapterPatterns) {
                    const match = regex.exec(line);
                    if (match) {
                        const lessonNum = parseInt(match[1]);
                        const pageNum = parseInt(match[3]);
                        if (lessonNum > 0 && pageNum > 0 && pageNum <= book.totalPages + 50 && match[2].length > 3) {
                            if (lessonNum > 10 && pageNum < 5 && book.totalPages > 100) continue;
                            currentEntries.push({ lesson: lessonNum, title: cleanTitle(match[2]), printedStartPage: pageNum, module: currentModule });
                            break;
                        }
                    }
                }
            }
        }
        if (currentEntries.length > bestTocEntries.length) bestTocEntries = currentEntries;
    }

    let tocEntries = bestTocEntries;
    const unique = [];
    const seen = new Set();
    tocEntries.sort((a, b) => a.lesson - b.lesson);
    for (const e of tocEntries) { if (!seen.has(e.lesson)) { unique.push(e); seen.add(e.lesson); } }
    tocEntries = unique;

    if (tocEntries.length < 5) {
        console.log(`[${book.id}] TOC sparse (${tocEntries.length}). Scanning...`);
        const scanEntries: { lesson: number, title: string, printedStartPage: number }[] = [];
        const p1 = /^(?:Lesson|LESSON)\s*[-–]?\s*(\d+)\s*(.*)$/i;
        const p2 = /^(\d+)\.1\s*(?:INTRODUCTION|OBJECTIVES|Overview)/i;
        const blacklist = ['MATHEMATICS', 'NOTES', 'ECONOMICS', 'ACCOUNTANCY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'Notes', 'Mathematics'];

        for (const page of book.pages) {
            const lines = page.content.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                let match = p1.exec(line);
                if (match) {
                    const lNum = parseInt(match[1]);
                    let title = match[2].trim() || (i < lines.length - 1 ? lines[i + 1].trim() : "");
                    if (lNum > 0 && title.length > 3 && !blacklist.includes(title)) {
                        scanEntries.push({ lesson: lNum, title: cleanTitle(title), printedStartPage: page.pageNumber });
                        break;
                    }
                }
                match = p2.exec(line);
                if (match) {
                    const lNum = parseInt(match[1]);
                    let title = "";
                    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
                        const prevLine = lines[j].trim();
                        if (prevLine && prevLine.length > 5 && !/^\d+$/.test(prevLine) && !blacklist.includes(prevLine)) {
                            title = prevLine; break;
                        }
                    }
                    if (lNum > 0 && title.length > 3) {
                        scanEntries.push({ lesson: lNum, title: cleanTitle(title), printedStartPage: page.pageNumber });
                        break;
                    }
                }
                if (/^\d+$/.test(line)) {
                    const lNum = parseInt(line);
                    if (lNum >= 10 && i < lines.length - 1) {
                        const nextLine = cleanTitle(lines[i + 1].trim());
                        if (/^[A-Z][A-Z\s]{5,}$/.test(nextLine) && !blacklist.includes(nextLine)) {
                            scanEntries.push({ lesson: lNum, title: nextLine, printedStartPage: page.pageNumber });
                            break;
                        }
                    }
                }
            }
        }
        if (scanEntries.length >= tocEntries.length && scanEntries.length > 0) {
            console.log(`[${book.id}] Found ${scanEntries.length} via scan.`);
            scanEntries.sort((a, b) => a.lesson - b.lesson);
            const finalRes = [];
            const seenS = new Set();
            for (const ent of scanEntries) { if (!seenS.has(ent.lesson)) { finalRes.push(ent); seenS.add(ent.lesson); } }
            for (let i = 0; i < finalRes.length; i++) {
                const entry = finalRes[i];
                let endPage = i < finalRes.length - 1 ? finalRes[i + 1].printedStartPage - 1 : book.totalPages;
                chapters.push({ title: `Lesson ${entry.lesson}: ${entry.title}`, startPage: entry.printedStartPage, endPage });
            }
            return chapters;
        }
    }

    if (tocEntries.length === 0) return [];

    let offset = 0;
    let offsetFound = false;
    for (let i = 0; i < Math.min(8, tocEntries.length); i++) {
        const lesson = tocEntries[i];
        const titleParts = lesson.title.split(' ').filter(w => w.length > 3).map(w => w.toLowerCase());
        for (let pOffset = -5; pOffset <= 60; pOffset++) {
            const pdfPageNum = lesson.printedStartPage + pOffset;
            if (pdfPageNum < 1 || pdfPageNum > book.totalPages) continue;
            const page = book.pages.find(p => p.pageNumber === pdfPageNum);
            if (!page) continue;
            const content = page.content.toLowerCase();
            const exactMatch = content.indexOf(lesson.title.toLowerCase()) !== -1;
            let partsMatch = false;
            if (!exactMatch && titleParts.length >= 1) {
                const prefix = content.substring(0, 1500);
                if (prefix.indexOf(titleParts[0]) !== -1 && (titleParts.length < 2 || prefix.indexOf(titleParts[1]) !== -1)) partsMatch = true;
            }
            const hasKeywords = /objectives|introduction|let us sum up|check your progress|questions|summary|notes/i.test(content.substring(0, 2000));
            if ((exactMatch || partsMatch) && hasKeywords) {
                offset = pOffset;
                console.log(`[${book.id}] Offset found: ${offset} (Lesson ${lesson.lesson} "${lesson.title}" at PDF ${pdfPageNum})`);
                offsetFound = true; break;
            }
        }
        if (offsetFound) break;
    }
    if (!offsetFound) { console.log(`[${book.id}] Using default 14.`); offset = 14; }

    for (let i = 0; i < tocEntries.length; i++) {
        const entry = tocEntries[i];
        const startPage = entry.printedStartPage + offset;
        let endPage = i < tocEntries.length - 1 ? tocEntries[i + 1].printedStartPage + offset - 1 : book.totalPages;
        chapters.push({ title: `Lesson ${entry.lesson}: ${entry.title}`, module: entry.module, startPage: Math.max(1, startPage), endPage: Math.max(startPage, endPage) });
    }
    return chapters;
}

async function main() {
    try {
        const files = fs.readdirSync(booksDir);
        const jsonFiles = files.filter(file => file.toLowerCase().endsWith('.json'));
        const allMetadata: BookMetadata[] = [];
        for (const file of jsonFiles) {
            const filePath = path.join(booksDir, file);
            const book: BookJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            console.log(`Analyzing ${file}...`);
            allMetadata.push({ bookId: book.id, chapters: extractChapters(book) });
        }
        fs.writeFileSync(outputFile, JSON.stringify(allMetadata, null, 2));
        console.log(`Saved to ${outputFile}`);
    } catch (error) { console.error('Error:', error); }
}

main();
