'use client';

import { Container, Title, Text, Button, Card, SimpleGrid, Group, ThemeIcon, Badge } from '@mantine/core';
import { ArrowLeft, FileText } from 'lucide-react';
import { COURSES } from '@/data/courses';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CourseDetailPage() {
    const params = useParams();
    const router = useRouter();

    const courseId = params?.courseId as string;
    const course = COURSES.find(c => c.id === courseId);

    if (!course) {
        return (
            <Container py="xl">
                <Title order={2} mb="md">Course not found</Title>
                <Button onClick={() => router.back()}>Go Back</Button>
            </Container>
        );
    }

    return (
        <Container size="lg" py="xl">
            <Button variant="subtle" leftSection={<ArrowLeft size={16} />} onClick={() => router.back()} mb="xl">
                Back to Courses
            </Button>

            <Title order={1}>{course.title} ({course.code})</Title>
            <Text size="lg" c="dimmed" mb="xl">{course.description}</Text>

            <Title order={3} mb="md">Study Materials</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
                {course.books.map((book, index) => (
                    <Card key={index} shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Group>
                                <ThemeIcon color={course.color} variant="light">
                                    <FileText size={20} />
                                </ThemeIcon>
                                <Text fw={500}>Book {index + 1}</Text>
                            </Group>
                            <Badge color={course.color}>{book.split('.').pop()?.toUpperCase()}</Badge>
                        </Group>
                        <Text size="sm" c="dimmed" mb="md" lineClamp={1}>
                            {book}
                        </Text>
                        <Button
                            component={Link}
                            href={`/courses/${courseId}/read/${book}`}
                            fullWidth
                            variant="light"
                            color={course.color}
                        >
                            Read Now
                        </Button>
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
}
