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
import DocumentCreateRequest from "../Models/DocumentCreateRequest.tsx";
import '@mantine/dates/styles.css';
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";
import { OCR } from "./OCR.tsx";

interface DocumentFormProps {
    opened: boolean;
    close: () => void;
    imageUrl: string;
    onDocumentCreated?: (newDocument: any) => void;
    onReset?: () => void;
    openImageUpload?: () => void;
}

const CreateDocumentForm: React.FC<DocumentFormProps> = ({opened, close, imageUrl, onDocumentCreated, onReset, openImageUpload}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [warrantyCheck, setWarrantyCheck] = useState<boolean>(false);
    const [showText, setShowText] = useState<boolean>(false);
    const [spendingCategories, setSpendingCategories] = useState<SpendingCategory[]>([]);
    const { user } = useContext(AuthContext);

    // Define the default form values
    const defaultFormValues = {
        timeStamp: new Date(),
        name: '',
        description: '',
        imageLink: imageUrl,
        imageContent: '',
        amountSpent: 0,
        company: '',
        hasWarranty: false,
        warrantyDuration: 0,
        userId: user?.id ?? -1,
        spendingCategoryIds: [],
    };

    // Custom close handler that resets form fields
    const handleClose = () => {
        // Reset form to default values
        documentForm.reset();
        setWarrantyCheck(false);
        setShowText(false);
        
        // Notify parent component to clear the image URL
        if (onReset) {
            onReset();
        }

        close();
    };
    const handleOcr = async () => {
        if(!imageUrl) {
            console.error("imageUrl is required");
            return;
        }
        setLoading(true);

        try {
            // Use the OCR class to process the image
            const ocrResult = await OCR.processImage(imageUrl);

            if (ocrResult.text) {
                documentForm.setFieldValue('imageContent', ocrResult.text);
                documentForm.setFieldValue('amountSpent', ocrResult.amount);
                documentForm.setFieldValue('company', ocrResult.company);

                // Set the date if one was found, otherwise keep the default (current date)
                if (ocrResult.date) {
                    documentForm.setFieldValue('timeStamp', ocrResult.date);
                }
            } else {
                documentForm.setFieldValue('imageContent', `Failed to extract text from ${imageUrl}`);
            }
        } catch(e) {
            console.error("OCR failed: ", e);
            documentForm.setFieldValue('imageContent', `Failed to extract text from ${imageUrl}`);
        } finally {
            setLoading(false);
        }
    };

    const documentForm = useForm<DocumentCreateRequest>({
        mode: 'controlled',
        initialValues: defaultFormValues,
        validate: {
            name: (value: string) => {
                if (/^[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(value)) {
                    return 'Document name cannot contain only numbers or special characters';
                }
                if (value.length < 2 || value.length >30) {
                    return 'Document name must be at between 2 and 30 characters long';
                }
                return null;
            },
            description: (value: string) => {
                if (value.length >1024) {
                    return 'Document description must have less than 1024 characters';
                }
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

    const handleDocumentSubmit = async (formData: DocumentCreateRequest) => {
        setLoading(true);
        axios.defaults.withCredentials = true;

        if(!user) return;

        try {
            const response = await axios.post(`${LOCAL_HOST_API_URL}/Documents`, {
                timeStamp: formData.timeStamp.toUTCString(),
                name: formData.name,
                description: formData.description,
                imageLink: formData.imageLink,
                imageContent: formData.imageContent,
                amountSpent: formData.amountSpent,
                company: formData.company,
                hasWarranty: formData.hasWarranty,
                warrantyDuration: formData.warrantyDuration,
                userId: formData.userId,
                spendingCategoryIds: formData.spendingCategoryIds,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
            });

            notifications.show({
                message: 'Document created successfully!'
            });

            // Call the callback to notify parent component about the new document
            if (onDocumentCreated) {
                onDocumentCreated(response.data);
            }

            // Use the custom close handler to reset form and close modal
            handleClose();
        } catch (e) {
            const error = e as AxiosError<{message: string}>;
            console.error('Error during document creation:', error);

            notifications.show({
                message: 'Error during document creation',
                color: "red",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if(!opened || !imageUrl) return;

        (async () => {
            await handleOcr();
        })();
    }, [opened, imageUrl]);

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
                console.error(`Error during fetch - SpendingCategories`  );
            } finally {

            }
        }

        fetchUserSpendingCategories().catch((error) => console.error(`Error during fetch: ${error}`));
    }, [opened]);

    useEffect(() => {
        if (opened) {
            // Update the form with the current imageUrl
            documentForm.setFieldValue('imageLink', imageUrl);
            
            // If there's no image, make sure all fields are reset
            if (!imageUrl) {
                documentForm.setValues({
                    ...defaultFormValues,
                    userId: user?.id ?? -1,
                });
            }
        }
    }, [opened, imageUrl]);

    return (
        <>
            <Modal
                opened={opened}
                onClose={handleClose}
                closeOnClickOutside={false}
                title={"New Document form"}
                centered
                size={"50%"}
            >
                {loading ? (
                    <Loader/>
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
                                                    styles={{
                                                        root: {
                                                            width: '100%',
                                                        },
                                                    }}
                                                >
                                                    {imageUrl ? 'Reupload Image' : 'Upload Image'}
                                                </Button>
                                            )}
                                            <Button
                                                leftSection={showText ? <IconFileText size={14} /> : <IconEye size={14} />}
                                                onClick={() => setShowText(!showText)}
                                                variant="outline"
                                                size="xs"
                                                styles={{
                                                    root: {
                                                        width: '100%',
                                                    },
                                                }}
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
                                                src={imageUrl ? imageUrl : "https://placehold.co/600x400?text=Placeholder"}
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
                                        defaultValue={new Date()}
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
                                            mb={"20"}
                                            //Gray out the "warrantyCheck" label if it's disabled
                                            styles={{
                                                label: {color: warrantyCheck ? "white" : "gray"},
                                            }}
                                        />
                                    </Stack>
                                </Stack>
                            </Group>

                            <Center>
                                <Button type="submit" loading={loading} mt="xl">
                                    Create document
                                </Button>
                            </Center>
                        </form>
                    </>
                )}
            </Modal>
        </>
    )
};

export default CreateDocumentForm;