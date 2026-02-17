'use client';

import { Timeline, Text, ThemeIcon, Card } from '@mantine/core';
import * as LucideIcons from 'lucide-react';

interface KeyConcept {
    title: string;
    description: string;
    icon: string;
}

interface InfographicViewerProps {
    data: KeyConcept[];
}

export default function InfographicViewer({ data }: InfographicViewerProps) {
    return (
        <Timeline active={data.length - 1} bulletSize={24} lineWidth={2} className="notebook-paper" p="xl" style={{ borderRadius: 8 }}>
            {data.map((item, index) => {
                // Dynamic icon rendering
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const IconComponent = (LucideIcons as any)[item.icon] || LucideIcons.Box;

                return (
                    <Timeline.Item
                        key={index}
                        bullet={<ThemeIcon size={24} radius="xl" color="blue.9"><IconComponent size={14} /></ThemeIcon>}
                        title={<Text fw={600} size="lg" style={{ fontFamily: "'Kalam', cursive !important", color: '#d32f2f' }}>{item.title}</Text>}
                    >
                        <Card withBorder={false} padding="sm" radius="md" mt="xs" bg="transparent" style={{ borderLeft: '2px dashed #abced4' }}>
                            <Text size="sm" style={{
                                fontFamily: "'Kalam', cursive",
                                fontWeight: 700,
                                lineHeight: 1.4
                            }}>
                                {item.description}
                            </Text>
                        </Card>
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
}
