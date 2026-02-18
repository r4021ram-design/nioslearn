'use client';

import {
    Button, Group, Title, Drawer, ScrollArea, Stack, Text, Loader, Radio, Card, Alert,
    ActionIcon, NumberInput, Box, Tabs, Badge, NavLink, Tooltip, Menu, Flex
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { ArrowLeft, BrainCircuit, HelpCircle, ChevronLeft, ChevronRight, FileText, CheckCircle, Network, ListChecks, Book, Menu as MenuIcon, MoreVertical } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { getSummary, getQuiz, getMindMap, getInfographic, getPodcast } from '@/app/actions';
import classes from './page.module.css';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import MindMapViewer from './MindMapViewer';
import InfographicViewer from './InfographicViewer';
import bookMetadata from '@/../scripts/book-metadata.json';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface BookChapter {
    title: string;
    module?: string;
    startPage: number;
    endPage: number;
}

interface QuizQuestion {
    question: string;
    options: string[];
    answer: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface PDFOutlineItem {
    title: string;
    dest: string | any[];
    items: PDFOutlineItem[];
}

export default function PDFReaderPage() {
    const params = useParams();
    const router = useRouter();
    const [opened, { open, close }] = useDisclosure(false);
    const [sidebarOpened, { toggle: toggleSidebar }] = useDisclosure(true);
    const [chapterDrawerOpened, { open: openChapterDrawer, close: closeChapterDrawer }] = useDisclosure(false);
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [viewMode, setViewMode] = useState<'pdf' | 'ai'>('pdf');

    const bookFilename = decodeURIComponent(params?.bookFilename as string);
    const pdfUrl = `/books/${bookFilename}`;

    // PDF State
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState(1.0);
    const [outline, setOutline] = useState<PDFOutlineItem[]>([]);
    const [pdfDocument, setPdfDocument] = useState<any>(null);

    // Metadata State
    const bookData = bookMetadata.find(b => b.bookId === bookFilename.replace(/\.pdf$/i, ''));
    const metaChapters = bookData?.chapters || [];

    // AI State
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mindMap, setMindMap] = useState<{ nodes: any[], edges: any[] } | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [infographic, setInfographic] = useState<any[] | null>(null);
    const [podcastUrl, setPodcastUrl] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [score, setScore] = useState<number | null>(null);
    const [aiMode, setAiMode] = useState<'full' | 'page' | 'chapter'>('page');
    const [chapterRange, setChapterRange] = useState<{ start: number, end: number } | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('summary');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onDocumentLoadSuccess(pdf: any) {
        setNumPages(pdf.numPages);
        setPdfDocument(pdf);

        pdf.getOutline().then((outline: PDFOutlineItem[]) => {
            setOutline(outline || []);
        });
    }

    // Helper to resolve page number from outline destination
    const resolvePageNumber = async (dest: string | any[]): Promise<number> => {
        if (typeof dest === 'string') {
            return 1;
        } else if (Array.isArray(dest)) {
            const ref = dest[0];
            if (pdfDocument) {
                try {
                    const index = await pdfDocument.getPageIndex(ref);
                    return index + 1;
                } catch (e) {
                    console.error("Error getting page index", e);
                    return 1;
                }
            }
        }
        return 1;
    };

    const handleChapterAction = async (item: any, action: 'summary' | 'quiz' | 'mindmap' | 'infographic') => {
        let startPage: number;
        let endPage: number;

        if (item.startPage !== undefined) {
            startPage = item.startPage;
            endPage = item.endPage;
        } else {
            startPage = await resolvePageNumber(item.dest);
            endPage = Math.min(startPage + 20, numPages);
        }

        setAiMode('chapter');
        setPageNumber(startPage);
        setChapterRange({ start: startPage, end: endPage });

        if (isMobile) {
            closeChapterDrawer();
            open();
        } else {
            setViewMode('ai');
        }

        if (action === 'summary') {
            setActiveTab('summary');
            setLoading(true);
            setSummary(null);
            try {
                const result = await getSummary(bookFilename, 'chapter', startPage, endPage);
                setSummary(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else if (action === 'quiz') {
            setActiveTab('quiz');
            setLoading(true);
            setQuiz(null);
            try {
                const result = await getQuiz(bookFilename, 'chapter', startPage, endPage);
                setQuiz(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else if (action === 'mindmap') {
            setActiveTab('mindmap');
            setLoading(true);
            setMindMap(null);
            try {
                const result = await getMindMap(bookFilename, 'chapter', startPage, endPage);
                setMindMap(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        } else if (action === 'infographic') {
            setActiveTab('infographic');
            setLoading(true);
            setInfographic(null);
            try {
                const result = await getInfographic(bookFilename, 'chapter', startPage, endPage);
                setInfographic(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
    };

    const changePage = (offset: number) => {
        setPageNumber(prevPageNumber => {
            const newPage = prevPageNumber + offset;
            return Math.max(1, Math.min(newPage, numPages));
        });
    };

    const handleSummarize = async () => {
        setLoading(true);
        setSummary(null);
        try {
            const endPage = aiMode === 'chapter' && chapterRange ? chapterRange.end : undefined;
            const result = await getSummary(bookFilename, aiMode, pageNumber, endPage);
            setSummary(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuiz = async () => {
        setLoading(true);
        setQuiz(null);
        setScore(null);
        setAnswers({});
        try {
            const endPage = aiMode === 'chapter' && chapterRange ? chapterRange.end : undefined;
            const result = await getQuiz(bookFilename, aiMode, pageNumber, endPage);
            setQuiz(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMindMap = async () => {
        setLoading(true);
        setMindMap(null);
        try {
            const endPage = aiMode === 'chapter' && chapterRange ? chapterRange.end : undefined;
            const result = await getMindMap(bookFilename, aiMode, pageNumber, endPage);
            setMindMap(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInfographic = async () => {
        setLoading(true);
        setInfographic(null);
        try {
            const endPage = aiMode === 'chapter' && chapterRange ? chapterRange.end : undefined;
            const result = await getInfographic(bookFilename, aiMode, pageNumber, endPage);
            setInfographic(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePodcast = async () => {
        setLoading(true);
        setPodcastUrl(null);
        try {
            const result = await getPodcast(bookFilename) as string;
            setPodcastUrl(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const submitQuiz = () => {
        if (!quiz) return;
        let correct = 0;
        quiz.forEach((q, index) => {
            if (answers[index] === q.answer) correct++;
        });
        setScore(correct);
    };

    const ChapterListContent = () => (
        <>
            {metaChapters.length > 0 ? (
                <Stack gap={0}>
                    {metaChapters.map((item: BookChapter, index) => (
                        <Group key={index} justify="space-between" p="xs" className={classes.chapterItem} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <Box style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                                setPageNumber(item.startPage);
                                setChapterRange({ start: item.startPage, end: item.endPage });
                                setAiMode('chapter');
                                if (isMobile) closeChapterDrawer();
                            }}>
                                <Text size="sm" fw={500} lineClamp={1}>{item.title}</Text>
                                <Text size="xs" c="dimmed">{item.module ? `${item.module} ` : ''}(Pages {item.startPage}-{item.endPage})</Text>
                            </Box>
                            <Menu position="bottom-end">
                                <Menu.Target>
                                    <ActionIcon variant="subtle" size="sm"><MoreVertical size={14} /></ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item leftSection={<FileText size={14} />} onClick={() => handleChapterAction(item, 'summary')}>Summarize Lesson</Menu.Item>
                                    <Menu.Item leftSection={<HelpCircle size={14} />} onClick={() => handleChapterAction(item, 'quiz')}>Quiz Lesson</Menu.Item>
                                    <Menu.Item leftSection={<Network size={14} />} onClick={() => handleChapterAction(item, 'mindmap')}>Mind Map</Menu.Item>
                                    <Menu.Item leftSection={<ListChecks size={14} />} onClick={() => handleChapterAction(item, 'infographic')}>Infographic</Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    ))}
                </Stack>
            ) : outline.length === 0 ? (
                <Text c="dimmed" size="sm" p="md" ta="center">No chapters found.</Text>
            ) : (
                <Stack gap={0}>
                    {outline.map((item, index) => (
                        <Group key={index} justify="space-between" p="xs" className={classes.chapterItem} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <Text
                                size="sm"
                                style={{ cursor: 'pointer', flex: 1 }}
                                lineClamp={2}
                                onClick={async () => {
                                    const pg = await resolvePageNumber(item.dest);
                                    setPageNumber(pg);
                                    if (isMobile) closeChapterDrawer();
                                }}
                            >
                                {item.title}
                            </Text>
                            <Menu position="bottom-end">
                                <Menu.Target>
                                    <ActionIcon variant="subtle" size="sm"><MoreVertical size={14} /></ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Item leftSection={<FileText size={14} />} onClick={() => handleChapterAction(item, 'summary')}>Summarize Chapter</Menu.Item>
                                    <Menu.Item leftSection={<HelpCircle size={14} />} onClick={() => handleChapterAction(item, 'quiz')}>Quiz Chapter</Menu.Item>
                                    <Menu.Item leftSection={<Network size={14} />} onClick={() => handleChapterAction(item, 'mindmap')}>Mind Map</Menu.Item>
                                    <Menu.Item leftSection={<ListChecks size={14} />} onClick={() => handleChapterAction(item, 'infographic')}>Infographic</Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    ))}
                </Stack>
            )}
        </>
    );

    const AIContent = () => (
        <Stack p="md" style={{ flex: 1, minHeight: 0 }}>
            <Group justify="space-between" align="center">
                <Box>
                    <Title order={4}>Deep Dive AI Analysis</Title>
                    <Text size="sm" c="dimmed">
                        AI-powered visual learning tools.
                    </Text>
                </Box>
                <Badge size="lg" color={aiMode === 'page' ? 'blue' : aiMode === 'chapter' ? 'teal' : 'orange'}>
                    Mode: {aiMode === 'page' ? `Page ${pageNumber}` : aiMode === 'chapter' ? `Chapter (${chapterRange?.start}-${chapterRange?.end})` : 'Full Book'}
                </Badge>
            </Group>

            <Radio.Group
                value={aiMode}
                onChange={(val) => setAiMode(val as 'full' | 'page' | 'chapter')}
                label="Context Scope"
            >
                <Group mt="xs">
                    <Radio value="page" label="Current Page" />
                    <Radio value="chapter" label="Chapter" disabled={!chapterRange} />
                    <Radio value="full" label="Full Book" />
                </Group>
            </Radio.Group>

            <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <Tabs.List grow>
                    <Tabs.Tab value="summary" leftSection={<FileText size={16} />}>Summary</Tabs.Tab>
                    <Tabs.Tab value="quiz" leftSection={<HelpCircle size={16} />}>Quiz</Tabs.Tab>
                    <Tabs.Tab value="mindmap" leftSection={<Network size={16} />}>Mind Map</Tabs.Tab>
                    <Tabs.Tab value="infographic" leftSection={<ListChecks size={16} />}>Infographic</Tabs.Tab>
                    <Tabs.Tab value="podcast" leftSection={<BrainCircuit size={16} />}>Audio Podcast</Tabs.Tab>
                </Tabs.List>

                <Box mt="md" style={{ flex: 1, overflow: 'auto' }}>
                    <Tabs.Panel value="summary">
                        <Button onClick={handleSummarize} fullWidth loading={loading} mb="md">
                            Generate Summary
                        </Button>
                        {summary && (
                            <Box className="notebook-paper">
                                <ScrollArea h={500}>
                                    <Text style={{ whiteSpace: 'pre-line' }}>{summary}</Text>
                                </ScrollArea>
                            </Box>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="quiz">
                        <Button onClick={handleQuiz} fullWidth loading={loading} mb="md">
                            Generate Quiz
                        </Button>
                        {quiz && (
                            <Stack className="notebook-paper" p="md" style={{ borderRadius: 8 }}>
                                {quiz.map((q, index) => (
                                    <Box key={index} mb="lg">
                                        <Text fw={500} mb="xs">{index + 1}. {q.question}</Text>
                                        <Radio.Group
                                            value={answers[index]}
                                            onChange={(val) => setAnswers({ ...answers, [index]: val })}
                                        >
                                            <Stack gap="xs">
                                                {q.options.map((opt, i) => (
                                                    <Radio key={i} value={opt} label={opt} styles={{ label: { fontFamily: "'Kalam', cursive !important", fontWeight: 700 } }} />
                                                ))}
                                            </Stack>
                                        </Radio.Group>
                                    </Box>
                                ))}
                                <Button onClick={submitQuiz} color="teal">Submit Answers</Button>
                                {score !== null && (
                                    <Alert icon={<CheckCircle size={16} />} title="Results" color="green" mt="md">
                                        You scored {score} out of {quiz.length}!
                                    </Alert>
                                )}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="mindmap">
                        <Button onClick={handleMindMap} fullWidth loading={loading} mb="md">
                            Generate Mind Map
                        </Button>
                        {mindMap && (
                            <Box h={600} style={{ border: '1px solid #eee', borderRadius: 8 }}>
                                <MindMapViewer data={mindMap} />
                            </Box>
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="infographic">
                        <Button onClick={handleInfographic} fullWidth loading={loading} mb="md">
                            Generate Infographic
                        </Button>
                        {infographic && (
                            <InfographicViewer data={infographic} />
                        )}
                    </Tabs.Panel>

                    <Tabs.Panel value="podcast">
                        <Box p="md" bg="blue.0" style={{ borderRadius: 8 }} mb="md">
                            <Text size="sm" fw={500} c="blue.9">Deep Dive Podcast</Text>
                            <Text size="xs" c="blue.7">Generate a high-quality AI conversation about this book using NotebookLM.</Text>
                        </Box>
                        <Button onClick={handlePodcast} fullWidth loading={loading} color="grape" leftSection={<BrainCircuit size={16} />}>
                            {podcastUrl ? 'Regenerate Podcast' : 'Generate Podcast'}
                        </Button>
                        {podcastUrl && (
                            <Stack mt="md">
                                <Alert color="green" title="Podcast Ready" icon={<CheckCircle size={16} />}>
                                    <Text size="sm">Your AI Deep Dive is ready to play.</Text>
                                </Alert>
                                <Box style={{ width: '100%' }}>
                                    <audio controls src={podcastUrl} style={{ width: '100%' }}>
                                        Your browser does not support the audio element.
                                    </audio>
                                </Box>
                                <Button component="a" href={podcastUrl} download variant="light" color="blue" fullWidth>
                                    Download Podcast
                                </Button>
                            </Stack>
                        )}
                    </Tabs.Panel>
                </Box>
            </Tabs>
        </Stack>
    );

    return (
        <div className={classes.container}>
            <Group p="xs" bg="gray.1" justify="space-between" className={classes.header}>
                <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => router.back()}>
                    Back to Course
                </Button>
                <Title order={5} className={classes.title} lineClamp={1}>
                    {bookFilename}
                </Title>
                <Group>
                    <Button
                        variant="light"
                        color="blue"
                        leftSection={<Book size={16} />}
                        onClick={() => {
                            if (isMobile) {
                                openChapterDrawer();
                            } else {
                                toggleSidebar();
                            }
                        }}
                    >
                        Chapters
                    </Button>
                    <Button
                        variant="filled"
                        color={viewMode === 'ai' ? 'blue' : 'grape'}
                        leftSection={viewMode === 'ai' ? <FileText size={16} /> : <BrainCircuit size={16} />}
                        onClick={() => {
                            if (isMobile) {
                                open();
                            } else {
                                setViewMode(viewMode === 'pdf' ? 'ai' : 'pdf');
                            }
                        }}
                    >
                        {viewMode === 'ai' ? 'Read Document' : 'Deep Dive AI'}
                    </Button>
                </Group>
            </Group>

            <Flex style={{ height: 'calc(100vh - 60px)' }}>
                {!isMobile && sidebarOpened && (
                    <Box w={300} bg="white" style={{ borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                        <Box p="md" style={{ borderBottom: '1px solid #eee' }}>
                            <Title order={6}>Chapters</Title>
                        </Box>
                        <ScrollArea style={{ flex: 1 }}>
                            <ChapterListContent />
                        </ScrollArea>
                    </Box>
                )}

                <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    {viewMode === 'pdf' ? (
                        <>
                            <Group justify="center" p="xs" bg="white" style={{ borderBottom: '1px solid #eee' }}>
                                <ActionIcon
                                    variant="light"
                                    onClick={() => changePage(-1)}
                                    disabled={pageNumber <= 1}
                                >
                                    <ChevronLeft size={18} />
                                </ActionIcon>
                                <Text size="sm">
                                    Page {pageNumber} of {numPages}
                                </Text>
                                <ActionIcon
                                    variant="light"
                                    onClick={() => changePage(1)}
                                    disabled={pageNumber >= numPages}
                                >
                                    <ChevronRight size={18} />
                                </ActionIcon>
                                <NumberInput
                                    value={scale}
                                    onChange={(val) => setScale(Number(val))}
                                    step={0.1}
                                    min={0.5}
                                    max={3.0}
                                    w={80}
                                    size="xs"
                                    decimalScale={1}
                                />
                            </Group>

                            <Box className={classes.pdfWrapper} bg="gray.2" p="md" style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <Document
                                    file={pdfUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className={classes.document}
                                    loading={<Loader />}
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        className={classes.page}
                                        width={isMobile ? window.innerWidth - 40 : undefined}
                                    />
                                </Document>
                            </Box>
                        </>
                    ) : (
                        <Box bg="white" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <AIContent />
                        </Box>
                    )}
                </Box>
            </Flex>

            <Drawer
                opened={chapterDrawerOpened}
                onClose={closeChapterDrawer}
                title="Chapters"
                padding="md"
                size="80%"
            >
                <ChapterListContent />
            </Drawer>

            <Drawer
                opened={opened}
                onClose={close}
                title="Deep Dive AI"
                position="right"
                size={isMobile ? "100%" : "lg"}
                padding="md"
            >
                <AIContent />
            </Drawer>
        </div>
    );
}
