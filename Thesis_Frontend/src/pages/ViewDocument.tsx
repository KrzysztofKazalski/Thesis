import { useLocation, useNavigate } from 'react-router-dom';
import {Container, Title, Text, Group, Badge, Button, Stack, Paper, Center, Divider, Card} from '@mantine/core';
import {IconArrowLeft, IconEye, IconFileText} from '@tabler/icons-react';
import {useCallback, useContext, useEffect, useState} from "react";
import Document from "../Models/Document.tsx";
import axios from 'axios';
import {notifications} from "@mantine/notifications";
import EditDocumentForm from "../components/EditDocumentForm.tsx";
import {useDisclosure} from "@mantine/hooks";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";
import UploadDocumentImage from "../components/UploadDocumentImage.tsx";
import {AuthContext} from "../context/AuthContext.tsx";

const ViewDocument = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [showImage, setShowImage] = useState(true);
    const [loading, setLoading] = useState(false);
    const [editDocumentOpened, { open: openEditDocument, close: closeEditDocument }] = useDisclosure(false);
    const [uploadImageOpened, { open: openUploadImage, close: closeUploadImage }] = useDisclosure(false);
    const [imageUrl, setImageUrl] = useState<string>("");

    const { user } = useContext(AuthContext);

    const handleDocumentDelete = async (id: number) => {
        setLoading(true);

        if(!user) return;

        try {
            const response = await axios.delete(`${LOCAL_HOST_API_URL}/Documents/${id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            if (response.status === 200) {
                notifications.show({
                    message: 'Document deleted successfully!'
                });
            } else {
                notifications.show({
                    color: "red",
                    message: 'Error during document deletion!'
                });
            }
            navigate(`/Documents`);
        } catch (error) {
            notifications.show({
                color: "red",
                message: 'Error during document deletion!'
            });
            console.error("Error during document deletion: " + error);

        } finally {
            setLoading(false);
        }
    }

    const fetchDocument = useCallback(async (id: number) => {
        setLoading(true);

        if(!user) return;

        try {
            const response = await axios.get(`${LOCAL_HOST_API_URL}/Documents/${id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            setDocument(response.data);
            setImageUrl(response.data.imageUrl);
        } catch (error) {
            notifications.show({
                color: "red",
                message: 'Error fetching updated document'
            });
            console.error("Error fetching document:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (location.state?.document) {
            setDocument(location.state.document);
            return;
        }

        const id = location.pathname.split('/').pop();
        if (id && !document) {
            fetchDocument(parseInt(id));
        }
    }, [location.state, location.pathname]);

    useEffect(() => {
        // Fetch when edit modal closes and we have a document
        if (!editDocumentOpened && document?.id) {
            fetchDocument(document.id);
        }
    }, [editDocumentOpened]);


    if (!document) {
        return <Center><Text>No document data found</Text></Center>;
    }

    // Handle image upload for document editing
    const handleImageUpload = (imageUrl: string) => {
        setImageUrl(imageUrl);
    }

    return (
        <>
            <UploadDocumentImage
                opened={uploadImageOpened}
                close={closeUploadImage}
                openDocumentForm={openEditDocument}
                handleImageUpload={handleImageUpload}
            />
            <EditDocumentForm
                opened={editDocumentOpened}
                close={closeEditDocument}
                document={document}
                imageUrl={imageUrl}
                openImageUpload={openUploadImage}
            />

            <Container size="md">
                <Button
                    leftSection={<IconArrowLeft size={14} />}
                    variant="subtle"
                    onClick={() => navigate('/documents')}
                    mb="xl"
                >
                    Back to Documents
                </Button>

                <Paper shadow="sm" radius="md" p="xl" withBorder>
                    <Stack>
                        <Group >
                            <Title order={2}>{document.name}</Title>
                        </Group>


                        <Group justify={"space-between"}>
                            <Text size="sm" c="dimmed">
                                Created on: {new Date(document.timestamp).toLocaleDateString()}
                            </Text>

                        </Group>

                        <Divider/>

                        <Group justify={"space-between"} align={"start"}>
                            <Stack>
                                <Text>{document.description}</Text>

                                <Group>
                                    <Text fw={500}>Amount Spent: ${document.amountSpent}</Text>
                                    {document.hasWarranty && (
                                        <Badge color="blue">
                                            Warranty: {document.warrantyDuration} months
                                        </Badge>
                                    )}
                                </Group>

                                <Text c="dimmed">Company: {(document.company || document.company.length != 0) ? document.company : "No company listed"}</Text>

                                <Group>
                                    <Text fw={500}>Categories:</Text>
                                    {document.spendingCategories.map((category) => (
                                        <Badge key={category.id} variant="light">
                                            {category.name}
                                        </Badge>
                                    ))}
                                </Group>
                            </Stack>

                            <Stack>
                                <Button
                                    variant="light"
                                    size="sm"
                                    color="blue"
                                    radius="md"
                                    onClick={openEditDocument}
                                    loading={loading}
                                >Edit document</Button>
                                <Button
                                    variant="light"
                                    size="sm"
                                    color="red"
                                    radius="md"
                                    onClick={() => handleDocumentDelete(document.id)}
                                    loading={loading}
                                >Delete document</Button>
                            </Stack>
                        </Group>

                        <Divider/>

                        <Button
                            leftSection={showImage ? <IconFileText size={14} /> : <IconEye size={14} />}
                            onClick={() => setShowImage(!showImage)}
                            variant="outline"
                            size="xs"
                            mb="md"
                        >
                            {showImage ? 'View Text Content' : 'View Image'}
                        </Button>

                        {showImage ? (
                            <img
                                src={
                                    document.imageLink.length!=0 ?
                                        document.imageLink
                                        :
                                        "The image wasn't provided. Feel free to edit the document and add it :)"
                                }
                                alt="The image could not be loaded."
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        ) : (
                            <Card>
                                <Text>{document.imageContent}</Text>
                            </Card>

                        )}

                    </Stack>
                </Paper>
            </Container>
        </>
    );
};

export default ViewDocument; 