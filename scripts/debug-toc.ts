
const testStrings = [
    "1. Sets .......................................................................................................................01-24",
    "2. Relations and Functions-I.....................................................................................25-58",
    "3. Trigonometric Functions-I....................................................................................59-94",
    "Lesson 1: Overview of Indian Economy 2",
    "1. Introduction to Accounting 1",
    "2. Accounting Concepts and Conventions 12",
    "MODULE - I\nSets, Relations and Functions"
];

function testRegex(name: string, regex: RegExp) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`Regex: ${regex.source}`);
    testStrings.forEach(str => {
        regex.lastIndex = 0;
        const match = regex.exec(str);
        if (match) {
            console.log(`MATCH: "${str.substring(0, 20)}..." -> L:${match[1]}, T:"${match[2].trim()}", P:${match[3]}`);
        } else {
            console.log(`NO MATCH: "${str.substring(0, 20)}..."`);
        }
    });
}

// 1. Current Regex
testRegex("Current", /^(\d+)\.?\s+(.+?)[\s\.]+(\d+)(?:\s*-\s*\d+)?$/gm);

// 2. Looser Regex
// Matches start number, then anything (lazy) until a sequence of dots OR spaces, then number at end
testRegex("Looser", /^(\d+)\.?\s+(.+?)(?:\.{2,}|\s{2,})\s*(\d+)(?:\s*-\s*\d+)?$/gm);

// 3. Dot-specific Regex
testRegex("DotSpecific", /^(\d+)\.?\s+(.+?)\.+\s*(\d+)/gm);
