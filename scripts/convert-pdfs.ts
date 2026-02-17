
import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse/lib/pdf-parse.js');

const booksDir = path.join(process.cwd(), 'public', 'books');

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

async function convertPdfToJson(filename: string) {
    const filePath = path.join(booksDir, filename);
    const dataBuffer = fs.readFileSync(filePath);
    const bookId = path.basename(filename, '.pdf');

    console.log(`Processing ${filename}...`);

    const pageTexts: string[] = [];

    const options = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pagerender: function (pageData: any) {
            return pageData.getTextContent()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .then(function (textContent: any) {
                    let lastY, text = '';
                    // eslint-disable-next-line
                    for (const item of textContent.items) {
                        if (lastY == item.transform[5] || !lastY) {
                            text += item.str;
                        }
                        else {
                            text += '\n' + item.str;
                        }
                        lastY = item.transform[5];
                    }
                    // pageData.pageIndex is 0-based
                    pageTexts[pageData.pageIndex] = text;
                    return text;
                });
        }
    }

    try {
        const data = await pdf(dataBuffer, options);

        const pages: BookPage[] = pageTexts.map((text, index) => ({
            pageNumber: index + 1,
            content: text
        }));

        const bookJson: BookJson = {
            id: bookId,
            sourcePdf: filename,
            totalPages: data.numpages,
            pages: pages
        };

        const jsonPath = path.join(booksDir, `${bookId}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(bookJson, null, 2));
        console.log(`Saved JSON to ${jsonPath}`);

    } catch (error) {
        console.error(`Error processing ${filename}:`, error);
    }
}

async function main() {
    try {
        const files = fs.readdirSync(booksDir);
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        console.log(`Found ${pdfFiles.length} PDF files.`);

        for (const file of pdfFiles) {
            await convertPdfToJson(file);
        }

        console.log('All PDF files processed.');
    } catch (error) {
        console.error('Error reading directory:', error);
    }
}

main();
