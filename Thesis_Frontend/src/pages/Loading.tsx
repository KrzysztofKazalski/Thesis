import { Center, Loader } from '@mantine/core';

const Loading = () => {
    return (
        <>
            <Center>
                <Loader size={"xl"} type={"dots"}/>
            </Center>
        </>
    );
};

export default Loading;
