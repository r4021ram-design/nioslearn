
export interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    books: string[]; // filenames
    color: string;
}

export const COURSES: Course[] = [
    {
        id: 'math-311',
        code: '311',
        title: 'Mathematics',
        description: 'Senior Secondary Mathematics course covering Algebra, Calculus, and more.',
        books: ['311_E_book1.pdf', '311_E_book2.pdf'],
        color: 'blue',
    },
    {
        id: 'acc-320',
        code: '320',
        title: 'Accountancy',
        description: 'Introduction to Accounting, Financial Statements, and Partnership Accounts.',
        books: ['320_E_book1.pdf', '320_E_book2.pdf', '320_E_book3.pdf'],
        color: 'teal',
    },
    {
        id: 'eco-318',
        code: '318',
        title: 'Economics',
        description: 'Study of Micro and Macro Economics, Indian Economic Development.',
        books: ['Book1_318.pdf', 'Book2_318.pdf'],
        color: 'orange',
    },
    {
        id: 'deo-336',
        code: '336',
        title: 'Data Entry Operations',
        description: 'Basics of Computer, Operating Systems, and Office Automation.',
        books: ['srsec336eng.pdf'],
        color: 'grape',
    },
];
