import {Menu} from '@mantine/core'
import {IconLogin, IconUsersPlus} from "@tabler/icons-react";
import * as React from "react";

const GuestMenu: React.FC<{
    openLogin: () => void;
    openRegister: () => void;
}> = ({openLogin, openRegister}) => {
    return(
            <Menu.Dropdown>
                <Menu.Label>Guest Account</Menu.Label>
                <Menu.Item leftSection={<IconLogin size={14} />} onClick={openLogin}>
                    Log in
                </Menu.Item>
                <Menu.Item leftSection={<IconUsersPlus size={14} />} onClick={openRegister}>
                    Register
                </Menu.Item>
            </Menu.Dropdown>
    );
}

export default GuestMenu;