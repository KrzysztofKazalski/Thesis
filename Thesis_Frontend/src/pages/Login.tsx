import { Text, Stack, Button, Center } from '@mantine/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as React from "react";

const Login: React.FC<{
    openLogin: () => void;
}> = ({ openLogin }) => {
    const navigate = useNavigate();

    useEffect(() => {
        openLogin();
    }, [openLogin]);

    return (
        <>
            <Center style={{ height: '80vh' }}>
                <Stack align="center">
                    <Text size="xl" fw={500}>Welcome to QuikChek!</Text>
                    <Text>New to the site? Register now to start managing your finances efficiently.</Text>
                    <Text>Already have an account? Log in to continue your journey.</Text>
                    <Button 
                        variant="filled" 
                        onClick={() => navigate('/')}
                    >
                        Return to Homepage
                    </Button>
                </Stack>
            </Center>
        </>
    );
};

export default Login;
