'use client';

import Link from 'next/link';
import { Container, Title, Text, Button, Group } from '@mantine/core';

export default function Home() {
  return (
    <Container size="md" py="xl">
      <Title order={1} ta="center" mt="xl">
        Welcome to NIOS EdTech
      </Title>
      <Text c="dimmed" ta="center" mt="md" size="lg" maw={580} mx="auto">
        Your integrated learning ecosystem for NIOS Senior Secondary education.
        Access courses, track your progress, and succeed in your studies.
      </Text>

      <Group justify="center" mt="xl">
        <Button
          component={Link}
          href="/dashboard"
          size="lg"
          variant="filled"
          target="_blank"
          rel="noopener noreferrer"
        >
          Start Learning
        </Button>
        <Button
          component={Link}
          href="/courses"
          size="lg"
          variant="outline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Browse Courses
        </Button>
      </Group>
    </Container>
  );
}
