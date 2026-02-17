/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const pdf = require('pdf-parse/lib/pdf-parse.js');
const path = require('path');

// Mock data buffer
async function test() {
    // Just finding a file to test. 
    // I know books are in public/books. Let's list them first or just try one I saw in courses.ts
    // 311_E_book1.pdf
    const filePath = path.join(process.cwd(), 'public', 'books', '311_E_book1.pdf');

    try {
        const dataBuffer = fs.readFileSync(filePath);

        const options = {
            pagerender: function (pageData) {
                // This seems to be the hook for per-page text
                return pageData.getTextContent()
                    .then(function (textContent) {
                        let lastY, text = '';
                        for (let item of textContent.items) {
                            if (lastY == item.transform[5] || !lastY) {
                                text += item.str;
                            }
                            else {
                                text += '\n' + item.str;
                            }
                            lastY = item.transform[5];
                        }
                        return text; // This text is concatenated to the main text
                    });
            }
        }

        // Standard render to see what happens
        const data = await pdf(dataBuffer);
        console.log("Total Pages:", data.numpages);
        console.log("Text Length:", data.text.length);
        console.log("First 500 chars:", data.text.substring(0, 500));

        // The default pdf-parse concatenates everything with \n\n usually.
        // If I want per-page, I might need to use the render callback to store it in an external array?

    } catch (e) {
        console.error(e);
    }
}

test();
