'use client';

import Link from 'next/link';

import {
    AppShell,
    Burger,
    Group,
    Text,
    Title,
    Card,
    SimpleGrid,
    Progress,
    Button,
    Badge,
    Avatar,
    ActionIcon,
    ThemeIcon,
    Stack,
    Container,
    NavLink,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    BookOpen,
    Award,
    Clock,
    LayoutDashboard,
    FileText,
    Settings,
    Bell,
    Search,
    PlayCircle,
} from 'lucide-react';
import { COURSES } from '@/data/courses';
import classes from './page.module.css';

export default function DashboardPage() {
    const [opened, { toggle }] = useDisclosure();

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Title order={3}>NIOS EdTech</Title>
                    </Group>
                    <Group>
                        <ActionIcon variant="subtle" size="lg">
                            <Search size={20} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" size="lg">
                            <Bell size={20} />
                        </ActionIcon>
                        <Avatar src={null} alt="User" color="blue" radius="xl">
                            ST
                        </Avatar>
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="md">
                <Stack gap="xs">
                    <NavLink
                        label="Dashboard"
                        leftSection={<LayoutDashboard size={16} />}
                        active
                        variant="filled"
                    />
                    <NavLink label="My Courses" leftSection={<BookOpen size={16} />} />
                    <NavLink label="Assignments" leftSection={<FileText size={16} />} />
                    <NavLink label="Certificates" leftSection={<Award size={16} />} />
                    <NavLink label="Settings" leftSection={<Settings size={16} />} />
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main>
                <Container size="xl" p={0}>
                    <Title order={2} mb="xl">
                        Welcome back, Student!
                    </Title>

                    {/* Stats Overview */}
                    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" mb="xl">
                        <StatsCard
                            title="Courses Enrolled"
                            value={COURSES.length.toString()}
                            icon={BookOpen}
                            color="blue"
                        />
                        <StatsCard
                            title="Hours Learned"
                            value="12.5"
                            icon={Clock}
                            color="teal"
                        />
                        <StatsCard
                            title="Assignments Due"
                            value="2"
                            icon={FileText}
                            color="orange"
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                        {/* Continue Learning Section */}
                        <Stack>
                            <Title order={4}>Continue Learning</Title>
                            <Card shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Text fw={500}>Senior Secondary: Mathematics (311)</Text>
                                    <Badge color="pink" variant="light">
                                        In Progress
                                    </Badge>
                                </Group>

                                <Text size="sm" c="dimmed" mb="md">
                                    Module 3: Calculus - Lesson 5: Limits and Continuity
                                </Text>

                                <Group mb="xs">
                                    <Text size="xs" c="dimmed">
                                        65% Completed
                                    </Text>
                                </Group>
                                <Progress value={65} mb="md" color="blue" size="sm" />

                                <Button
                                    component={Link}
                                    href="/courses/math-311"
                                    fullWidth
                                    variant="light"
                                    rightSection={<PlayCircle size={16} />}
                                >
                                    Resume Lesson
                                </Button>
                            </Card>
                        </Stack>

                        {/* Recommended Courses Section */}
                        <Stack>
                            <Title order={4}>Your Courses</Title>
                            {COURSES.map((course) => (
                                <Card key={course.id} shadow="sm" padding="lg" radius="md" withBorder>
                                    <Group wrap="nowrap">
                                        <ThemeIcon size={40} radius="md" variant="light" color={course.color}>
                                            <BookOpen size={24} />
                                        </ThemeIcon>
                                        <div className={classes.flexCenter}>
                                            <Text fw={500}>{course.title} ({course.code})</Text>
                                            <Text size="sm" c="dimmed">
                                                {course.description}
                                            </Text>
                                        </div>
                                        <Button
                                            component={Link}
                                            href={`/courses/${course.id}`}
                                            variant="outline"
                                            size="xs"
                                        >
                                            View
                                        </Button>
                                    </Group>
                                </Card>
                            ))}
                        </Stack>
                    </SimpleGrid>
                </Container>
            </AppShell.Main>
        </AppShell>
    );
}

function StatsCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between">
                <div>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        {title}
                    </Text>
                    <Text fw={700} size="xl">
                        {value}
                    </Text>
                </div>
                <ThemeIcon color={color} variant="light" size={38} radius="md">
                    <Icon size={24} strokeWidth={1.5} />
                </ThemeIcon>
            </Group>
        </Card>
    );
}
