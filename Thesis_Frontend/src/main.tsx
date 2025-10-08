import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {BrowserRouter} from "react-router-dom";
import App from './App.tsx'
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/dates/styles.css';


// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';
import {MantineProvider} from "@mantine/core";
import {AuthProvider} from "./context/AuthContext.tsx";
import {Notifications} from "@mantine/notifications";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <MantineProvider defaultColorScheme="dark">
                <Notifications/>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
            </MantineProvider>
        </AuthProvider>
    </StrictMode>
)
