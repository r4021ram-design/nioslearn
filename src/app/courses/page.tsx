'use client';

import Link from 'next/link';
import { Container, Title, SimpleGrid, Card, Text, Badge, Button, Group, Box } from '@mantine/core';
import { COURSES } from '@/data/courses';

export default function CoursesPage() {
    return (
        <Container size="lg" py="xl">
            <Title order={1} mb="xl" ta="center">Available Courses</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {COURSES.map((course) => (
                    <Card key={course.id} shadow="sm" padding="lg" radius="md" withBorder>
                        <Card.Section>
                            {/* Placeholder image logic or dynamic logic could go here */}
                            <Box h={160} bg={`var(--mantine-color-${course.color}-1)`} />
                        </Card.Section>

                        <Group justify="space-between" mt="md" mb="xs">
                            <Text fw={500}>{course.title}</Text>
                            <Badge color={course.color} variant="light">
                                {course.code}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" mih={50}>
                            {course.description}
                        </Text>

                        <Text size="xs" c="dimmed" mt="xs">
                            Books available: {course.books.length}
                        </Text>

                        <Button
                            component={Link}
                            href={`/courses/${course.id}`}
                            variant="light"
                            color={course.color}
                            fullWidth
                            mt="md"
                            radius="md"
                        >
                            Start Learning
                        </Button>
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
}
