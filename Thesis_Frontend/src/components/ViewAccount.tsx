import {Avatar, Flex, Group, Modal, TextInput} from '@mantine/core';
import {useContext} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import * as React from "react";

const ViewAccount: React.FC<{
    opened: boolean;
    close: () => void;
}> = ({opened, close}) => {
    const {user} = useContext(AuthContext);

    return(
        <>
            <Modal
                styles={{
                    header: {justifyContent: "center"},
                    title: {fontSize: "x-large"}
                }}
                opened={opened}
                onClose={close}
                size="xs"
                withCloseButton={false}
                centered={true}
                title={"User Profile"}
            >
                <Group justify={"center"}>
                    <Avatar size={"xl"}></Avatar>
                </Group>

                <Flex
                    justify={"center"}
                    align={"center"}
                    direction={"column"}
                    mt="md"
                >
                    <TextInput
                        label="Username"
                        disabled
                        value={user?.username}
                    />
                    <TextInput
                        label="Email"
                        disabled
                        value={user?.email}
                    />
                </Flex>
            </Modal>
        </>
    );
}

export default ViewAccount;