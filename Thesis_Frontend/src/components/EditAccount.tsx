import {Avatar, Button, Center, Group, Modal, TextInput, Text, Stack, Divider} from '@mantine/core';
import {useContext, useState} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import {PasswordInput} from "@mantine/core";
import {useForm} from "@mantine/form";
import axios, {AxiosError} from "axios";
import {notifications} from "@mantine/notifications";
import * as React from "react";
import {useNavigate} from "react-router-dom";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

const EditAccount: React.FC<{
    opened: boolean;
    close: () => void;
}> = ({opened, close}) => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const {user, logout, login} = useContext(AuthContext);
    const navigate = useNavigate();

    const userForm = useForm({
        mode: 'uncontrolled',
        initialValues: {
            username: '',
            password: '',
            confirmPassword: '',
        },

        validate: {
            username: (value: string | any[]) => (value.length > 0 || value.length === 0 ? null : 'Username is required'),
            password: (value: string) =>
                value.length === 0 || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(value)
                    ? null
                    : 'Password must be 8-64 characters, with at least 1 capital letter, 1 small letter, and 1 number',
            confirmPassword: (value: any, values: {password: any;}) =>
                values.password.length === 0 || value === values.password ? null : 'Passwords do not match',
        },
    });

    const handleEditSubmit = async (formData: { username: string; password: string; confirmPassword: string; }) => {
        setLoading(true);
        setErrorMessage(null);
        // Clear any previous field errors
        userForm.clearErrors();

        // Check if both fields are empty
        if (!formData.username && !formData.password) {
            setErrorMessage('No changes were made. Please update username or password');
            setLoading(false);
            return;
        }

        // Check if username is the same as current username
        if (formData.username && formData.username === user?.username) {
            userForm.setFieldError('username', 'Username has not been changed');
            setLoading(false);

            // If password is also not provided, show the general error message
            if (!formData.password) {
                setErrorMessage('No changes were made. Please update username or password');
            }
            return;
        }

        // If password is provided, ensure confirmPassword matches
        if (formData.password && formData.password !== formData.confirmPassword) {
            userForm.setFieldError('confirmPassword', 'Passwords do not match');
            setLoading(false);
            return;
        }

        axios.defaults.withCredentials = true;

        try {
            // Only include fields that have values in the request
            const updateData: {username?: string; password?: string} = {};

            if (formData.username) {
                updateData.username = formData.username;
            }

            if (formData.password) {
                updateData.password = formData.password;
            }

            await axios.put(`${LOCAL_HOST_API_URL}/Users/${user?.id}`,
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user?.token}`
                    },
                });

            // Update the user context with the new information
            if (user && formData.username) {
                // Create a new user object with updated username
                const updatedUser = {
                    ...user,
                    username: formData.username
                };

                // Update the user context and session storage
                login(updatedUser);
            }

            notifications.show({
                message: 'Account information update successful!'
            });
            close();
        } catch (error) {
            const err = error as AxiosError<any>;

            // Check for BadRequest response (status code 400)
            if (err.response?.status === 400) {
                // Extract error message from response
                const errorData = err.response.data;
                const errorMessage = typeof errorData === 'string'
                    ? errorData
                    : (errorData?.message || errorData?.title || JSON.stringify(errorData));

                // Check for specific error messages
                if (errorMessage.includes('Username is already in use') || errorMessage.includes('Username already in use')) {
                    // Set the error directly on the username field
                    userForm.setFieldError('username', 'Username is already in use');
                } else {
                    // Set a general error message for other errors
                    setErrorMessage(errorMessage || 'Account information update failed. Please try again.');
                }
            } else {
                // Handle other types of errors
                setErrorMessage(err.response?.data?.message || err.message || 'Account information update failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteUser = async () => {
        setLoading(true);
        setErrorMessage(null);
        axios.defaults.withCredentials = true;

        if(!user) return;

        try {
            const response = await axios.delete(`${LOCAL_HOST_API_URL}/Users/${user.id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                }
            );

            // Most REST APIs return 200/204 status code for successful deletion
            if (response.status == 200) {
                notifications.show({
                    message: 'Account deletion successful!',
                    color: 'green'
                });

                close();

                // Log out the user after successful account deletion
                logout();

                // Redirect to the login page
                navigate('/');
            } else {
                notifications.show({
                    message: 'Error deleting account. Please try again.',
                    color: 'red'
                });

                close();
            }
        } catch (error) {
            const err = error as AxiosError<{message: string}>;

            // Display a more helpful error message
            const errorMessage = err.response?.data?.message ||
                err.message ||
                'Account deletion failed. Please try again.';

            setErrorMessage(errorMessage);

            notifications.show({
                message: errorMessage,
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    }

    return(
        <>
            <Modal
                opened={opened}
                onClose={close}
                size="xs"
                withCloseButton={false}
                centered
                title={"Edit Account"}
            >
                <Center><Avatar size={"xl"}/></Center>
                <form onSubmit={userForm.onSubmit(handleEditSubmit)}>
                    <TextInput
                        label="Username"
                        placeholder={user?.username}
                        {...userForm.getInputProps("username")}
                    />
                    <PasswordInput
                        mt="md"
                        label="Password"
                        placeholder="Password"
                        {...userForm.getInputProps("password")}
                    />
                    <PasswordInput

                        label="Confirm password"
                        placeholder="Confirm password"
                        {...userForm.getInputProps("confirmPassword")}
                    />
                    {errorMessage && (
                        <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
                    )}
                    <Group justify="flex-end" mt="md">
                        <Button type="submit" loading={loading}>
                            Submit
                        </Button>
                    </Group>
                </form>

                <Divider my={"md"}/>
                <Stack
                    justify="center"
                    align={"center"}
                >
                    <Text c="dimmed">Danger zone</Text>
                    <Button
                        fullWidth
                        color="red"
                        onClick={handleDeleteUser}
                    >Delete User</Button>
                </Stack>

            </Modal>
        </>
    );
}

export default EditAccount;