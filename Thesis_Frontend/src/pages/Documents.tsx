import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {Card, Text, Group, Badge, Stack, Title, Container, Button, Select, TextInput, Pagination, Center} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useNavigate } from 'react-router-dom';
import UploadDocumentImage from "../components/UploadDocumentImage.tsx";
import {useDisclosure} from "@mantine/hooks";
import CreateDocumentForm from "../components/CreateDocumentForm.tsx";
import Document from "../Models/Document.tsx";
import SpendingCategory from '../Models/SpendingCategory.tsx';
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

const Documents = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { user } = useContext(AuthContext);
    const [uploadDocumentImageOpened, { open: openUploadDocumentImage, close: closeUploadDocumentImage }] = useDisclosure(false);
    const [documentFormOpened, { open: openDocumentForm, close: closeDocumentForm }] = useDisclosure(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const navigate = useNavigate();
    const [categories, setCategories] = useState<SpendingCategory[]>([]);
    const [sortKey, setSortKey] = useState<'name' | 'date' | 'category'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [filterCategory, setFilterCategory] = useState<number | null>(null);
    const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null]);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const documentsPerPage = 10;

    const sortOptions = [
        { label: 'Name', value: 'name' },
        { label: 'Date', value: 'date' },
        { label: 'Category', value: 'category' },
    ];
    const categoryOptions = [
        { label: 'All', value: '' },
        ...categories.map((cat) => ({ label: cat.name, value: cat.id.toString() }))
    ];

    useEffect(() => {
        fetchDocuments().catch((error) => console.error("Error in fetchDocuments:", error));
    }, [user]);

    const fetchDocuments = async () => {
        if (!user) return;
        
        try {
            const response = await axios.get(`${LOCAL_HOST_API_URL}/Documents/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            setDocuments(response.data);
        } catch (err) {
            setError('Failed to fetch documents');
            console.error('Error fetching documents:', err);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            if (!user) return;
            try {
                const response = await axios.get(`${LOCAL_HOST_API_URL}/SpendingCategories/user/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                setCategories(response.data);
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        };
        fetchCategories();
    }, [user]);

    const handleCardClick = (document: Document) => {
        navigate('/documents/view', { state: { document } });
    };

    const handleImageUpload = (imageUrl: string) => {
        setImageUrl(imageUrl);
    }

    if (error) return <Text>{error}</Text>;

    // Filtering and sorting logic
    const filteredDocuments = documents.filter((doc) => {
        // Search by title
        if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        // Filter by category
        if (filterCategory && !doc.spendingCategories.some((cat) => cat.id === filterCategory)) {
            return false;
        }
        // Filter by date range
        if (filterDateRange[0] && new Date(doc.timestamp) < filterDateRange[0]) {
            return false;
        }
        return !(filterDateRange[1] && new Date(doc.timestamp) > filterDateRange[1]);

    });

    const sortedDocuments = [...filteredDocuments].sort((a, b) => {
        let aValue: string | number = '', bValue: string | number = '';
        if (sortKey === 'name') {
            aValue = a.name?.toLowerCase() ?? '';
            bValue = b.name?.toLowerCase() ?? '';
        } else if (sortKey === 'date') {
            aValue = new Date(a.timestamp).getTime() || 0;
            bValue = new Date(b.timestamp).getTime() || 0;
        } else if (sortKey === 'category') {
            aValue = a.spendingCategories[0]?.name?.toLowerCase() ?? '';
            bValue = b.spendingCategories[0]?.name?.toLowerCase() ?? '';
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Calculate pagination values
    const totalPages = Math.ceil(sortedDocuments.length / documentsPerPage);
    const indexOfLastDocument = currentPage * documentsPerPage;
    const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
    const currentDocuments = sortedDocuments.slice(indexOfFirstDocument, indexOfLastDocument);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of the document list
        window.scrollTo({
            top: document.getElementById('documents-list')?.offsetTop || 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            <UploadDocumentImage
                opened={uploadDocumentImageOpened}
                close={closeUploadDocumentImage}
                openDocumentForm={openDocumentForm}
                handleImageUpload={handleImageUpload}
            />
            <CreateDocumentForm 
                opened={documentFormOpened} 
                close={closeDocumentForm} 
                imageUrl={imageUrl}
                onDocumentCreated={(newDocument) => {
                    // Add the new document to the documents list
                    setDocuments(prevDocuments => [...prevDocuments, newDocument]);
                }}
                onReset={() => {
                    // Clear the image URL when the form is closed
                    setImageUrl("");
                }}
                openImageUpload={() => {
                    // Open the image upload component
                    openUploadDocumentImage();
                }}
            />

            <Container>
                <Group
                    justify={"space-between"}
                >
                    <Title order={2} mb="xl">Your Documents</Title>
                    <Button onClick={openUploadDocumentImage} mb={"xl"} size={"md"}>New Document</Button>
                </Group>
                <TextInput
                    placeholder="Search by Document Name..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    mb="md"
                />
                {/* Sorting and Filtering Controls */}
                <Group mb="md" gap="md" wrap="nowrap">
                    <Text>Sort by:</Text>
                    <Select
                        value={sortKey}
                        onChange={(value: string | null) => value && setSortKey(value as 'name' | 'date' | 'category')}
                        data={sortOptions}
                        maw={150}
                    />
                    <Button variant="outline" size="xs" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                        {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                    </Button>
                    <Text>Filter by Category:</Text>
                    <Select
                        value={filterCategory !== null ? filterCategory.toString() : ''}
                        onChange={(value: string | null) => setFilterCategory(value ? Number(value) : null)}
                        data={categoryOptions}
                        maw={200}
                    />
                    <Text>Filter by Date:</Text>
                    <DatePickerInput
                        type="range"
                        value={filterDateRange}
                        onChange={setFilterDateRange}
                        placeholder="Pick date range"
                        mx="auto"
                        maw={250}
                    />
                </Group>
                <Stack id="documents-list">
                    {currentDocuments.map((d) => (
                        <Card
                            key={d.id}
                            shadow="sm"
                            padding="lg"
                            radius="md"
                            withBorder
                            //Magic transformation
                            style={{
                                transition: 'transform 150ms ease, box-shadow 150ms ease',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                            onClick={() => handleCardClick(d)}
                        >
                            <Group justify="space-between" mb="xs">
                                <Text fw={500}>{d.name}</Text>
                                <Text size="sm" c="dimmed">
                                    {new Date(d.timestamp).toLocaleDateString()}
                                </Text>
                            </Group>

                            <Text size="sm" c="dimmed" mb="md">
                                {d.description}
                            </Text>

                            <Group>
                                <Text size="sm">Amount Spent: ${d.amountSpent}</Text>
                                {d.hasWarranty && (
                                    <Badge color="blue">
                                        Warranty: {d.warrantyDuration} months
                                    </Badge>
                                )}
                            </Group>

                            <Text mb="md" size="xs" c="dimmed">Company: {(d.company || d.company.length != 0) ? d.company : "No company listed"}</Text>

                            <Group>
                                {d.spendingCategories.map((category) => (
                                    <Badge key={category.id} variant="light">
                                        {category.name}
                                    </Badge>
                                ))}
                            </Group>
                        </Card>
                    ))}
                </Stack>
                
                {/* Pagination controls */}
                {sortedDocuments.length > 0 && (
                    <Center mt="xl">
                        <Pagination 
                            total={totalPages} 
                            value={currentPage} 
                            onChange={handlePageChange} 
                            withEdges
                            disabled={totalPages <= 1}
                        />
                    </Center>
                )}
                
                {/* Show message when no documents are found */}
                {sortedDocuments.length === 0 && (
                    <Center mt="xl">
                        <Text size="lg" c="dimmed">No documents found matching your criteria.</Text>
                    </Center>
                )}
            </Container>
        </>
    );
};

export default Documents;