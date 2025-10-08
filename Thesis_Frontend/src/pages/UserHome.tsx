import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Container, Title, Text, Group, Card, SimpleGrid, Button, Stack, Badge } from '@mantine/core';
import { IconFileText, IconCategory, IconChartBar } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Document from '../Models/Document.tsx';
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

const UserHome = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        documentCount: 0,
        categoryCount: 0,
        totalSpent: 0
    });
    const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);

    useEffect(() => {
        if (user) {
            fetchUserStats();
            fetchRecentDocuments();
        }
    }, [user]);

    const fetchUserStats = async () => {
        if (!user) return;

        try {
            // Fetch document count
            const documentsResponse = await axios.get(`${LOCAL_HOST_API_URL}/Documents/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            // Fetch categories count
            const categoriesResponse = await axios.get(`${LOCAL_HOST_API_URL}/SpendingCategories/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            //Calculate total spending from documents
            const documents = documentsResponse.data;
            const totalSpent = documents.reduce((sum: any, doc: { amountSpent: any; }) => sum + (doc.amountSpent || 0), 0)

            setStats({
                documentCount: documentsResponse.data.length,
                categoryCount: categoriesResponse.data.length,
                totalSpent
            });
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const fetchRecentDocuments = async () => {
        if (!user) return;

        try {
            const response = await axios.get(`${LOCAL_HOST_API_URL}/Documents/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            
            // Sort documents by timestamp (newest first) and take the 5 most recent
            const sortedDocuments = [...response.data].sort((a, b) => {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }).slice(0, 5);
            
            setRecentDocuments(sortedDocuments);
        } catch (error) {
            console.error('Error fetching recent documents:', error);
        }
    };

    const navigateTo = (path: string) => {
        navigate(path);
    };

    const handleDocumentClick = (document: Document) => {
        navigate('/documents/view', { state: { document } });
    };

    return (
        <Container size="lg">
        <Title order={1} mb="xl">Welcome, {user?.username ? user.username.toUpperCase() : 'USER'}!</Title>

    {/*<Text size="lg" mb="xl">*/}
    {/*    QuikChek helps you manage your expenses and keep track of your important documents.*/}
    {/*    Here's your current overview:*/}
    {/*</Text>*/}

    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mb="xl">
    <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Card.Section p="md" bg="blue.1">
    <Group>
        <IconFileText size={24} color="black" />
    <Title order={3} c="black">Documents</Title>
        </Group>
        </Card.Section>
        <Text ta="center" fz="xl" fw={700} mt="md">
        {stats.documentCount}
        </Text>
        <Text ta="center" mb="md">
        Total Documents
    </Text>
    <Button
    fullWidth
    onClick={() => navigateTo('/documents')}
    variant="light"
        >
        View Documents
    </Button>
    </Card>

    <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Card.Section p="md" bg="green.1">
    <Group>
        <IconCategory size={24} color="black" />
    <Title order={3} c="black">Categories</Title>
        </Group>
        </Card.Section>
        <Text ta="center" fz="xl" fw={700} mt="md">
        {stats.categoryCount}
        </Text>
        <Text ta="center" mb="md">
        Total Categories
    </Text>
    <Button
    fullWidth
    onClick={() => navigateTo('/categories')}
    variant="light"
        >
        Manage Categories
    </Button>
    </Card>

    <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Card.Section p="md" bg="yellow.1">
    <Group>
        <IconChartBar size={24} color="black" />
    <Title order={3} c="black">Spending Summary</Title>
    </Group>
    </Card.Section>
    <Text ta="center" fz="xl" fw={700} mt="md">
        ${stats.totalSpent.toFixed(2)}
    </Text>
    <Text ta="center" mb="md">
        Total Spent
    </Text>
    <Button
    fullWidth
    onClick={() => navigateTo('/spendingSummary')}
    variant="light"
        >
        View Summary
    </Button>
    </Card>
    </SimpleGrid>

    <Card shadow="sm" padding="lg" radius="md" withBorder mb="xl">
    <Title order={3} mb="md">Recent Documents</Title>
    <Stack>
        {recentDocuments.length > 0 ? (
            recentDocuments.map((doc) => (
                <Card
                    key={doc.id}
                    shadow="sm"
                    padding="md"
                    radius="md"
                    withBorder
                    style={{
                        transition: 'transform 150ms ease, box-shadow 150ms ease',
                        cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    onClick={() => handleDocumentClick(doc)}
                >
                    <Group justify="space-between" mb="xs">
                        <Text fw={500}>{doc.name}</Text>
                        <Text size="sm">
                            {new Date(doc.timestamp).toLocaleDateString()}
                        </Text>
                    </Group>
                    <Text size="sm" mb="xs" lineClamp={1}>
                        {doc.description}
                    </Text>
                    <Group>
                        <Text size="sm">Amount: ${doc.amountSpent}</Text>
                        {doc.spendingCategories && doc.spendingCategories.map((category) => (
                            <Badge key={category.id} variant="light">
                                {category.name}
                            </Badge>
                        ))}
                    </Group>
                </Card>
            ))
        ) : (
            <Text ta="center">No documents yet. Add your first document!</Text>
        )}
        {recentDocuments.length > 0 && (
            <Button 
                variant="outline" 
                onClick={() => navigateTo('/documents')}
                mt="sm"
            >
                View All Documents
            </Button>
        )}
    </Stack>
    </Card>
    </Container>
);
};

    export default UserHome;