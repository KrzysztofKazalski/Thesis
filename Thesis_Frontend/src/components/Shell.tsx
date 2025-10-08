import {
    AppShell,
    Avatar,
    Burger,
    Button,
    Group,
    Image,
    MenuTarget,
    NavLink,
    Text
} from '@mantine/core';
import {Menu} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks';
import LoginRegister from "./LoginRegister.tsx";
import {useContext, useState} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import GuestMenu from "./GuestMenu.tsx";
import UserMenu from "./UserMenu.tsx";
import ViewAccount from "./ViewAccount.tsx";
import EditAccount from "./EditAccount.tsx";
import {notifications} from "@mantine/notifications";
import { ReactNode } from 'react';

interface ShellProps {
    children: ReactNode;
    openLogin: () => void;
    closeLogin: () => void;
    loginOpened: boolean;
}

export function Shell({ children, openLogin, closeLogin, loginOpened }: ShellProps) {
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const [viewAccountOpened, { open: openViewAccount, close: closeViewAccount }] = useDisclosure(false);
    const [editAccountOpened, { open: openEditAccount, close: closeEditAccount }] = useDisclosure(false);
    const [authMode, setAuthMode] = useState("login");

    const {user, logout} = useContext(AuthContext);


    return (
        <>
            <LoginRegister opened={loginOpened} close={closeLogin} mode={authMode}/>
            <ViewAccount opened={viewAccountOpened} close={closeViewAccount}/>
            <EditAccount opened={editAccountOpened} close={closeEditAccount}/>

            <AppShell
                header={{ height: 60 }}
                navbar={{
                    width: 300,
                    breakpoint: 'sm',
                    collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
                }}
                padding="md"
            >

                <AppShell.Header>
                    <Group h="100%" px="md" justify={"space-between"}>
                        <Group>
                            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
                            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
                            <Image w={30} radius={"md"} src={"/QuikChekLogo.png"}/>
                            <Text visibleFrom={"sm"}>QuikChek</Text>
                        </Group>
                        <Group align={"end"}>
                            <Avatar/>
                            <Menu shadow="md" width={200}>
                                <MenuTarget>
                                    <Button variant={"default"}>Account</Button>
                                </MenuTarget>
                                {user ? (
                                    <UserMenu
                                        openViewAccount={openViewAccount}
                                        openEditAccount={openEditAccount}
                                        logout={() => {
                                            notifications.show({
                                                message: "Logout successfull!"
                                            })
                                            logout();
                                        }}
                                    />
                                ):(
                                    <GuestMenu
                                        openLogin={() => {
                                            setAuthMode("login");
                                            openLogin();
                                        }}
                                        openRegister={() => {
                                            setAuthMode("register");
                                            openLogin();
                                        }}
                                    />
                                )}
                            </Menu>
                        </Group>
                    </Group>
                </AppShell.Header>

                <AppShell.Navbar p="md">
                    <NavLink label="Home" href={"/"}/>
                    <NavLink label="Documents" href="/documents" />
                    <NavLink label="Categories" href="/categories" />
                    <NavLink label="Spending Summary" href="/spendingSummary" />
                </AppShell.Navbar>

                <AppShell.Main>
                    {children}
                </AppShell.Main>
            </AppShell>
        </>
    );
}

export default Shell;
