import {Menu} from '@mantine/core'
import {IconEdit, IconLogout, IconUser,} from "@tabler/icons-react";
import * as React from "react";

const UserMenu: React.FC<{
    openViewAccount: () => void;
    openEditAccount: () => void;
    logout: () => void;
}> = ({openViewAccount, openEditAccount, logout}) => {
    return(
        <Menu.Dropdown>
            <Menu.Label>Account Management</Menu.Label>
            <Menu.Item leftSection={<IconUser size={14} />} onClick={openViewAccount}>
                View Profile
            </Menu.Item>
            <Menu.Item leftSection={<IconEdit size={14} />} onClick={openEditAccount}>
                Edit Profile
            </Menu.Item>
            <Menu.Item leftSection={<IconLogout size={14} />} onClick={logout}>
                Log out
            </Menu.Item>
        </Menu.Dropdown>
    );
}

export default UserMenu;