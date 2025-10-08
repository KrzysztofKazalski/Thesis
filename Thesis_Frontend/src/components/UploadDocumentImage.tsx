import {Button, Center, Group, Modal,Text} from "@mantine/core";
import {Dropzone, FileWithPath} from "@mantine/dropzone";
import {IconPhoto, IconUpload, IconX} from "@tabler/icons-react";
import {useContext, useState} from "react";
import {notifications} from "@mantine/notifications";
import * as React from "react";
import axios from "axios";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";
import {AuthContext} from "../context/AuthContext.tsx";

interface UploadDocumentImageProps {
    opened: boolean;
    close: () => void;
    openDocumentForm: () => void;
    handleImageUpload: (imageUrl: string) => void;
}

const UploadDocumentImage: React.FC<UploadDocumentImageProps> = ({opened, close, openDocumentForm, handleImageUpload}) => {

    const [loading, setLoading] = useState<boolean>(false);

    const { user } = useContext(AuthContext);

    const handleUpload = async (file: FileWithPath) => {
        setLoading(true);

        if(!user) return;

        if(!file) {
            notifications.show({
                message: "Please select an image to upload",
                color: 'red',
            });
            close();
            return;
        }

        try {
            /**
             * We request a presigned URL from the backend and then upload the image to S3
             */
            const response = await axios.get(`${LOCAL_HOST_API_URL}/s3/generate-presigned-url?folderName=documents&fileName=${file.name}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            const presignedUrl = response.data.url;

            await axios.put(presignedUrl, file, {
                headers: {
                    "Content-Type": file.type
                },
            });

            const publicUrl = presignedUrl.split("?")[0];
            notifications.show({
                message: `Image uploaded successfully`,
            });
            handleImageUpload(publicUrl);
            close();
            openDocumentForm();

        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload image.");
        } finally {
            setLoading(false);
        }
    }

    const handleFileDrop = async (selectedFiles: FileWithPath[]) => {
        if (selectedFiles.length === 0) return;

        setLoading(true);
        try{
            const selectedFile = selectedFiles[0];
            await handleUpload(selectedFile);
        }
        catch(e) {
            console.log(e);
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Modal opened={opened} onClose={close} closeOnClickOutside={false} title={"Upload document image"} size={"auto"} centered>
                <Dropzone
                    onDrop={handleFileDrop}
                    onReject={(files) => console.log('rejected files', files)}
                    maxSize={20 * 1024 ** 2}
                    maxFiles={1}
                    multiple={false}
                    loading={loading}
                    accept={["image/*"]} //TODO this might not work as expected, test later, allow only image types
                    mb={"xs"}
                    px={"xl"}
                    mx={"xl"}
                >
                    <Group justify="center" gap="xl" mih={220} style={{ pointerEvents: 'none' }}>
                        <Dropzone.Accept>
                            <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                            <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                            <IconPhoto size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                        </Dropzone.Idle>

                        <div>
                            <Text size="xl" inline>
                                Drag images here or click to select files
                            </Text>
                            <Text size="sm" c="dimmed" inline mt={7}>
                                Upload one file, it should not exceed 20mb
                            </Text>
                        </div>
                    </Group>
                </Dropzone>

                <Center>
                    <Button
                        onClick={() => {
                            close();
                            openDocumentForm();
                        }}
                        variant="default"
                        size={"xs"}
                    >
                        Skip image upload
                    </Button>
                </Center>
            </Modal>
        </>
    )
};

export default UploadDocumentImage;