import {Modal, Button, Group, PasswordInput, Checkbox, TextInput} from '@mantine/core';
import {useForm} from "@mantine/form"
import {useContext, useEffect, useState} from "react";
import axios, {AxiosError} from "axios";
import { AuthContext } from "../context/AuthContext.tsx";
import {notifications} from "@mantine/notifications";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

const LoginRegister: React.FC<{
    opened: boolean;
    close: () => void;
    mode: string;
}> = ({opened, close, mode}) => {
    const [activeButton, setActiveButton] = useState("login");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const {login} = useContext(AuthContext);
    const navigate = useNavigate();

    const registerForm = useForm({
        mode: 'uncontrolled',
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            termsOfService: false,
        },

        validate: {
            username: (value: string | any[]) => {
                if(!value || value.length === 0){
                    return 'Username is required';
                }
                if(value.length < 3 || value.length > 50){
                    return 'Username must be between 3 and 50 characters long'
                }
                return null;
            },
            email: (value: string) => {
                if(!value || value.length === 0){
                    return 'Email is required';
                }
                if(/^\S+@\S+$/.test(value)){
                    return null;
                }
                return 'Invalid email';
            },
            password: (value: string) => {
                if(!value || value.length === 0){
                    return 'Password is required';
                }
                if(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,64}$/.test(value)){
                    return null;
                }
                return 'Password must be 8-64 characters, with at least 1 capital letter, 1 small letter, and 1 number';
            },
            confirmPassword: (value: any, values: { password: any; }) =>
                value !== values.password ? 'Passwords do not match' : null,
            termsOfService: (value: boolean) => value ? null : 'Please agree to the terms and conditions',
        },
    });

    const loginForm = useForm({
        mode: 'uncontrolled',
        initialValues: {
            username: '',
            password: '',
        },
        validate: {
            username: (value: string | any[]) => (value.length > 0 ? null : 'Username is required'),
            password: (value: string | any[]) => (value.length > 0 ? null : 'Password is required'),
        },
    });

    const handleRegisterSubmit = async (formData: { username: string; email: string; password: string; }) => {
        setLoading(true);
        setErrorMessage(null);
        // Clear any previous field errors
        registerForm.clearErrors();
        
        axios.defaults.withCredentials = true;

        try {
            await axios.post(`${LOCAL_HOST_API_URL}/Users/register`, {
                username: formData.username,
                email: formData.email,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            console.log('Registration submitted successfully');

            // Auto login after successful registration
            try {
                const loginResponse = await axios.post(`${LOCAL_HOST_API_URL}/Users/login`, {
                    username: formData.username,
                    password: formData.password,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                // Store user data in context
                const user = loginResponse.data;
                login(user);
                
                notifications.show({
                    message: 'Registration successful!',
                    color: 'green'
                });

                close();

                navigate('/');
            } catch (loginError) {
                console.error('Auto-login after registration failed:', loginError);
                
                notifications.show({
                    message: 'Registration successful! Please log in.',
                    color: 'green'
                });
                
                // Switch to login tab
                setActiveButton("login");
            }
        } catch (e) {
            const error = e as AxiosError<any>;
            console.error('Error during registration:', error);
            
            // Check for BadRequest response (status code 400)
            if (error.response?.status === 400) {
                // Extract error message from response
                const errorData = error.response.data;
                const errorMessage = typeof errorData === 'string' 
                    ? errorData 
                    : (errorData?.message || errorData?.title || JSON.stringify(errorData));
                
                console.log('BadRequest error:', errorMessage);
                
                // Check for specific error messages
                if (errorMessage.includes('Username is already in use') || errorMessage.includes('Username already in use')) {
                    // Set the error directly on the username field
                    registerForm.setFieldError('username', 'Username is already in use');
                } else if (errorMessage.includes('Email is already in use') || errorMessage.includes('Email already in use')) {
                    // Set the error directly on the email field
                    registerForm.setFieldError('email', 'Email is already in use');
                } else {
                    // Set a general error message for other errors
                    setErrorMessage(errorMessage || 'Registration failed. Please try again.');
                }
            } else {
                // Handle other types of errors
                setErrorMessage('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }

    const handleLoginSubmit = async (formData: { username: string; password: string; }) => {
        setLoading(true);
        setErrorMessage(null);
        axios.defaults.withCredentials = true;

        try {
            const response = await axios.post(`${LOCAL_HOST_API_URL}/Users/login`, {
                username: formData.username,
                password: formData.password,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const user = response.data;
            login(user);

            notifications.show({
                message: 'Login successful!'
            });

            close();
            
            // Redirect to the root path which will show UserHome for authenticated users
            navigate('/');
        } catch (e) {
            const error = e as AxiosError<{message: string}>;
            console.error('Error during login:', error);
            setErrorMessage(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setActiveButton(mode);
    }, [mode]);

    return (
        <>
            <Modal opened={opened} onClose={close} size="md" withCloseButton={false} centered>
                <Button.Group>
                    <Button
                        variant={activeButton === "login" ? "filled" : "outline"}
                        fullWidth
                        onClick={() => setActiveButton("login")}
                    >Login
                    </Button>
                    <Button
                        variant={activeButton === "register" ? "filled" : "outline"}
                        fullWidth
                        onClick={() => setActiveButton("register")}
                    >Register
                    </Button>
                </Button.Group>

                {/*On Login */}
                {activeButton === "login" ? (
                    <form onSubmit={loginForm.onSubmit(handleLoginSubmit)}>
                        <TextInput
                            withAsterisk
                            label="Username"
                            placeholder="Username"
                            {...loginForm.getInputProps("username")}
                        />
                        <PasswordInput
                            withAsterisk
                            label="Password"
                            placeholder="Password"
                            {...loginForm.getInputProps("password")}
                        />
                        {errorMessage && (
                            <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
                        )}
                        <Group justify="flex-end" mt="md">
                            <Button type="submit" loading={loading}>
                                Login
                            </Button>
                        </Group>
                    </form>
                ) : ( // On register
                    <form onSubmit={registerForm.onSubmit(handleRegisterSubmit)}>
                        <TextInput
                            withAsterisk
                            label="Username"
                            placeholder="Username"
                            {...registerForm.getInputProps("username")}
                        />
                        <TextInput
                            withAsterisk
                            label="Email"
                            placeholder="your@email.com"
                            {...registerForm.getInputProps("email")}
                        />
                        <PasswordInput
                            withAsterisk
                            label="Password"
                            placeholder="Password"
                            {...registerForm.getInputProps("password")}
                        />
                        <PasswordInput
                            withAsterisk
                            label="Confirm password"
                            placeholder="Confirm password"
                            {...registerForm.getInputProps("confirmPassword")}
                        />
                        <Checkbox
                            mt="md"
                            label="I agree to sell my soul, assets, and everything I own!"
                            {...registerForm.getInputProps("termsOfService", { type: "checkbox" })}
                        />
                        {errorMessage && (
                            <div style={{ color: "red", marginTop: "10px" }}>{errorMessage}</div>
                        )}
                        <Group justify="flex-end" mt="md">
                            <Button type="submit" loading={loading}>
                                Register
                            </Button>
                        </Group>
                    </form>
                )}
            </Modal>
        </>
    );
}

export default LoginRegister;