import {
    Button,
    Checkbox,
    Loader,
    Modal,
    NumberInput,
    TextInput,
    Textarea,
    Group,
    Stack,
    Center,
    Chip,
    Text,
    Divider
} from "@mantine/core";
import * as React from "react";
import {useContext, useEffect, useState} from "react";
import {useForm} from "@mantine/form";
import { DateTimePicker } from '@mantine/dates';
import axios, {AxiosError} from "axios";
import {notifications} from "@mantine/notifications";
import {IconEye, IconFileText, IconUpload} from "@tabler/icons-react";
import SpendingCategory from "../Models/SpendingCategory.tsx";
import {AuthContext} from "../context/AuthContext.tsx";
import '@mantine/dates/styles.css';
import Document from "../Models/Document.tsx";
import DocumentEditRequest from "../Models/DocumentEditRequest.tsx";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";
import { OCR } from "./OCR.tsx";

interface DocumentFormProps {
    opened: boolean;
    close: () => void;
    imageUrl: string;
    document: Document;
    openImageUpload?: () => void;
}

const EditDocumentForm: React.FC<DocumentFormProps> = ({opened, close, imageUrl, document, openImageUpload}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [warrantyCheck, setWarrantyCheck] = useState<boolean>(document.hasWarranty);
    const [showText, setShowText] = useState<boolean>(false);
    const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>([]);
    const { user } = useContext(AuthContext);

    const documentForm = useForm<DocumentEditRequest>({
        mode: 'controlled',
        initialValues: {
            timeStamp: new Date(document.timestamp),
            name: document.name,
            description: document.description,
            imageContent: document.imageContent,
            imageLink: document.imageLink,
            amountSpent: document.amountSpent,
            company: document.company,
            hasWarranty: document.hasWarranty,
            warrantyDuration: document.warrantyDuration,
            spendingCategoryIds: document.spendingCategories.map(category => category.id.toString()),
        },
        validate: {
            name: (value: string) => {
                if (value.length < 2) {
                    return 'Document name must be at least 2 characters long';
                }
                if (value.length > 30) {
                    return 'Document name cannot exceed 30 characters';
                }
                if (/^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
                    return 'Document name cannot contain only numbers or special characters';
                }
                return null;
            },
            amountSpent: (value: number) => {
                if (value <= 0) {
                    return 'Amount must be greater than zero';
                }
                return null;
            },
            company: (value: string) => {
                if (value && /^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
                    return 'Company name cannot contain only numbers or special characters';
                }
                return null;
            },
            timeStamp: (value: Date) => {
                const now = new Date();
                if (value > now) {
                    return 'Date cannot be in the future';
                }
                return null;
            },
            warrantyDuration: (value: number, values) => {
                if (values.hasWarranty && value <= 0) {
                    return 'Warranty duration must be greater than zero';
                }
                return null;
            },
        },
    });

    // Handle OCR when a new image is uploaded
    const handleOcr = async (url: string) => {
        if (!url) {
            console.error("imageUrl is required for OCR");
            return;
        }
        
        setLoading(true);
        
        try {
            // Use the OCR class to process the image
            const ocrResult = await OCR.processImage(url);
            
            if (ocrResult.text) {
                // Update form values with OCR results
                documentForm.setFieldValue('imageContent', ocrResult.text);
                documentForm.setFieldValue('amountSpent', ocrResult.amount);
                documentForm.setFieldValue('company', ocrResult.company);
                
                // Set the date if one was found
                if (ocrResult.date) {
                    documentForm.setFieldValue('timeStamp', ocrResult.date);
                }
                
                // Store the OCR data in localStorage as a workaround for backend issues
                localStorage.setItem('lastDocumentImageContent', ocrResult.text);
                localStorage.setItem('lastDocumentCompany', ocrResult.company || '');
                localStorage.setItem('lastDocumentAmount', ocrResult.amount.toString());
            } else {
                documentForm.setFieldValue('imageContent', `Failed to extract text from ${url}`);
            }
        } catch(e) {
            console.error("OCR failed: ", e);
            documentForm.setFieldValue('imageContent', `Failed to extract text from ${url}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        documentForm.setValues({
            ...documentForm.values,
            imageLink: imageUrl || document.imageLink
        });
        
        // If a new image URL is provided, run OCR on it
        if (imageUrl && imageUrl !== document.imageLink) {
            handleOcr(imageUrl);
        }
    }, [imageUrl]);

    const handleDocumentSubmit = async (formData: DocumentEditRequest) => {
        setLoading(true);
        axios.defaults.withCredentials = true;

        if(!user) return;

        try {
            // Store the image link in localStorage as a workaround for backend issues
            if (formData.imageLink) {
                localStorage.setItem('lastDocumentImageLink', formData.imageLink);
            }

            const response = await axios.put(`${LOCAL_HOST_API_URL}/Documents/${document.id}`, {
                timeStamp: formData.timeStamp.toUTCString(),
                name: formData.name,
                description: formData.description,
                imageContent: formData.imageContent,
                imageLink: formData.imageLink,
                amountSpent: formData.amountSpent,
                company: formData.company,
                hasWarranty: formData.hasWarranty,
                warrantyDuration: formData.warrantyDuration,
                spendingCategoryIds: formData.spendingCategoryIds,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });
            if(response.data.code == 200) {
                notifications.show({
                    message: 'Document updated successfully!'
                });
            }

            close();
        } catch (e) {
            const error = e as AxiosError<{message: string}>;
            console.error('Error during document updation:', error);

            notifications.show({
                message: 'Error during document updation',
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const fetchUserSpendingCategories = async () => {
            if (!user) return;

            try {
                const response = await axios.get(`${LOCAL_HOST_API_URL}/SpendingCategories/user/${user?.id}`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                setSpendingCategories(response.data);
            } catch(err) {
                notifications.show({
                    message: 'Error during fetch: SpendingCategories',
                    color: "red",
                });
                console.error(`Error during fetch - SpendingCategories: ${err}`  );
            } finally {

            }
        }

        fetchUserSpendingCategories().catch((error) => console.error(`Error during fetch: ${error}`));
    }, [opened]);

    return (
        <>
            <Modal
                opened={opened}
                onClose={close}
                closeOnClickOutside={false}
                title={"Edit Document form"}
                centered
                size={"50%"}
            >
                {loading ? (
                    <Center style={{height: '300px'}}>
                        <Stack align="center">
                            <Loader size="xl" />
                            <Text>Processing image...</Text>
                        </Stack>
                    </Center>
                ) : (
                    <>
                        <form onSubmit={documentForm.onSubmit(handleDocumentSubmit)}>
                            <Stack mb={"md"}>
                                <Center>
                                    <Text c={"dimmed"} size={"xs"}>The "Other" category will be automatically added if nothing is selected</Text>
                                </Center>

                                <Chip.Group
                                    multiple
                                    {...documentForm.getInputProps('spendingCategoryIds')}
                                >
                                    <Group justify="center">
                                        {spendingCategories.map((spendingCategory) => (
                                            <Chip
                                                key={spendingCategory.id}
                                                value={spendingCategory.id.toString()}
                                                variant={spendingCategory.name === 'Other' ? 'outline' : 'filled'}
                                            >
                                                {spendingCategory.name}
                                            </Chip>
                                        ))}
                                    </Group>
                                </Chip.Group>
                            </Stack>

                            <Divider/>


                            <Group
                                gap={"xl"}
                                justify={"space-between"}
                                grow
                                align={"flex-start"}
                                mt={"md"}
                            >
                                <Stack justify={"space-between"} h={531}>
                                    <Stack>
                                        <Group grow mb="md">
                                            {openImageUpload && (
                                                <Button
                                                    onClick={() => {
                                                        // Close this form first, then open the image upload
                                                        close();
                                                        openImageUpload();
                                                    }}
                                                    variant="outline"
                                                    leftSection={<IconUpload size={14} />}
                                                    size="xs"
                                                >
                                                    {document.imageLink ? 'Reupload Image' : 'Upload Image'}
                                                </Button>
                                            )}
                                            <Button
                                                leftSection={showText ? <IconFileText size={14} /> : <IconEye size={14} />}
                                                onClick={() => setShowText(!showText)}
                                                variant="outline"
                                                size="xs"
                                            >
                                                {showText ? 'View Image' : 'View Text Content'}
                                            </Button>
                                        </Group>

                                        {showText ? (
                                            <Textarea
                                                label="Image text"
                                                placeholder="Image text here..."
                                                key={documentForm.key('imageContent')}
                                                {...documentForm.getInputProps("imageContent")}
                                                autosize
                                                minRows={20}
                                                maxRows={20}
                                            />
                                        ) : (
                                            <img
                                                src={documentForm.values.imageLink ? documentForm.values.imageLink : "https://placehold.co/600x400?text=Placeholder"}
                                                alt={"Image could not be loaded"}
                                                style={{ height: '480px', width: 'auto', objectFit: 'contain' }}
                                            />
                                        )}
                                    </Stack>
                                </Stack>


                                <Stack>
                                    <TextInput
                                        required
                                        label="Document Name"
                                        placeholder="Document Name here..."
                                        key={documentForm.key('name')}
                                        {...documentForm.getInputProps("name")}
                                    />


                                    <DateTimePicker
                                        label="Document Date"
                                        placeholder="Document Date here..."
                                        key={documentForm.key('timeStamp')}
                                        {...documentForm.getInputProps("timeStamp")}
                                    />

                                    <Textarea
                                        label="Description"
                                        placeholder="Document Description here..."
                                        key={documentForm.key('description')}
                                        {...documentForm.getInputProps("description")}
                                        autosize
                                        minRows={4}
                                        maxRows={4}
                                    />

                                    <NumberInput
                                        required
                                        min={0}
                                        label="Amount spent"
                                        placeholder="Amount spent here..."
                                        key={documentForm.key('amountSpent')}
                                        {...documentForm.getInputProps("amountSpent")}
                                        decimalScale={2}
                                    />

                                    <TextInput
                                        label="Company"
                                        placeholder="Company name here..."
                                        key={documentForm.key('company')}
                                        {...documentForm.getInputProps("company")}
                                    />

                                    <Stack gap={"0"}>
                                        <Checkbox
                                            label="Warranty"
                                            labelPosition="left"
                                            checked={documentForm.values.hasWarranty}
                                            onChange={(event) => {
                                                const isChecked = event.currentTarget.checked;
                                                documentForm.setFieldValue('hasWarranty', isChecked);
                                                setWarrantyCheck(isChecked);
                                                if (!isChecked) {
                                                    documentForm.setFieldValue('warrantyDuration', 0);
                                                }
                                            }}
                                        />

                                        <NumberInput
                                            required={warrantyCheck}
                                            min={0}
                                            disabled={!warrantyCheck}
                                            label="Warranty duration (months)"
                                            placeholder="Warranty duration here..."
                                            key={documentForm.key('warrantyDuration')}
                                            {...documentForm.getInputProps("warrantyDuration")}
                                            suffix=" months"
                                            allowDecimal={false}
                                            mb={20}
                                            styles={{
                                                label: {color: warrantyCheck ? "white" : "gray"},
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            </Group>

                            <Center>
                                <Button type="submit" loading={loading} mt="xl">
                                    Update document
                                </Button>
                            </Center>
                        </form>
                    </>
                )}
            </Modal>
        </>
    )
};

export default EditDocumentForm;