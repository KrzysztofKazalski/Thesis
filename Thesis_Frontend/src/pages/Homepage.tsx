import {Button, Card, Center, Stack, Title, Text, Image, Grid, Container, Group} from '@mantine/core';
import * as React from "react";

const Homepage: React.FC<{
    openLogin: () => void;
}> = ({openLogin}) => {

    return (
        <Container size="lg">
            <div>
                <Card mb="xl" withBorder shadow="sm" p="lg">
                    <Title order={2} mb="md">Why Use QuikChek?</Title>
                    <Text mb="md">
                        Tired of losing track of receipts and invoices? <b>QuikChek</b> makes it simple to store, organize, and analyze all your financial documents in one secure place. Whether you're managing personal finances or running a small business, our tool helps you stay on top of your spending, categorize your expenses, and quickly find any document when you need it.
                    </Text>
                    <Center>
                        <Stack mb="md" gap={4}>
                            <Text>✅ Upload receipts and invoices with ease</Text>
                            <Text>✅ Automatically categorize your documents</Text>
                            <Text>✅ Simpler and Faster document submission with OCR technology</Text>
                            <Text>✅ View summaries of your spending habits</Text>
                        </Stack>
                    </Center>
                </Card>

                {/* Categories Container */}
                <Card mb="xl" withBorder shadow="sm" p="lg">
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Title order={2} mb="md">Categories Management</Title>
                            <Text mb="md">
                                Managing your spending categories has never been easier. QuikChek allows you to create, edit, and organize custom categories that fit your specific financial needs. Whether you're tracking business expenses or personal spending, our intuitive category system helps you keep everything organized.
                            </Text>
                            <Text mb="md">
                                With QuikChek, you can:
                            </Text>
                            <Stack mb="md" gap={4}>
                                <Text>• Create custom categories tailored to your needs</Text>
                                <Text>• Edit category names and details anytime</Text>
                                <Text>• Organize documents by assigning them to specific categories</Text>
                                <Text>• Track spending patterns across different categories</Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Center h="100%">
                                <Image src="/Categories.png" alt="Categories Management" width={300} />
                            </Center>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* Documents Container */}
                <Card mb="xl" withBorder shadow="sm" p="lg">
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
                            <Center h="100%">
                                <Image src="/Documents.png" alt="Document Management" width={300} />
                            </Center>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
                            <Title order={2} mb="md">Document Management</Title>
                            <Text mb="md">
                                The Documents page is the heart of QuikChek, providing a comprehensive system for managing all your financial paperwork. Upload receipts, invoices, and other important documents with just a few clicks.
                            </Text>
                            <Text mb="md">
                                Our document management system allows you to:
                            </Text>
                            <Stack mb="md" gap={4}>
                                <Text>• Upload multiple document formats</Text>
                                <Text>• Add important details like date, amount, and description</Text>
                                <Text>• Assign categories to keep everything organized</Text>
                                <Text>• Quickly search and filter to find exactly what you need</Text>
                                <Text>• Edit document details or delete documents as needed</Text>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* OCR Technology Container */}
                <Card mb="xl" withBorder shadow="sm" p="lg">
                    <Title order={2} mb="md" ta="center">Powered by OCR Technology</Title>
                    <Text mb="lg" ta="center">
                        QuikChek leverages cutting-edge Optical Character Recognition (OCR) technology to make document management effortless.
                    </Text>
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Card withBorder h="100%">
                                <Title order={4} mb="sm">Automatic Data Extraction</Title>
                                <Text>
                                    Our OCR technology automatically extracts key information from your documents, including dates, amounts, and vendor names, saving you from manual data entry.
                                </Text>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Card withBorder h="100%">
                                <Title order={4} mb="sm">Smart Categorization</Title>
                                <Text>
                                    The system analyzes document content to suggest appropriate categories, making organization faster and more accurate.
                                </Text>
                            </Card>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Card withBorder h="100%">
                                <Title order={4} mb="sm">Searchable Documents</Title>
                                <Text>
                                    All text in your documents becomes fully searchable, allowing you to quickly find specific information across all your uploaded files.
                                </Text>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* Spending Summary Container */}
                <Card mb="xl" withBorder shadow="sm" p="lg">
                    <Title order={2} mb="lg" ta="center">Spending Summary</Title>
                    <Text mb="xl" ta="center">
                        Gain valuable insights into your spending patterns with our comprehensive analytics tools.
                    </Text>

                    {/* Donut Chart Section */}
                    <Card withBorder mb="xl" p="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Title order={3} mb="md">Spending Distribution</Title>
                                <Text mb="md">
                                    Our interactive donut charts provide a clear visual breakdown of your spending by category. Easily toggle between different time periods to see how your spending patterns change over time.
                                </Text>
                                <Stack mb="md" gap={4}>
                                    <Text>• View spending distribution by category</Text>
                                    <Text>• Compare monthly and yearly spending patterns</Text>
                                    <Text>• Select custom date ranges for detailed analysis</Text>
                                    <Text>• Switch between split and combined views</Text>
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Center h="100%">
                                    <Image src="/Donut_Chart.png" alt="Donut Chart" width={300} />
                                </Center>
                            </Grid.Col>
                        </Grid>
                    </Card>

                    {/* Categories Comparison Section */}
                    <Card withBorder mb="xl" p="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 2, md: 1 }}>
                                <Center h="100%">
                                    <Image src="/Bar_Chart.png" alt="Bar Chart" width={300} />
                                </Center>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 6 }} order={{ base: 1, md: 2 }}>
                                <Title order={3} mb="md">Categories Comparison</Title>
                                <Text mb="md">
                                    The bar chart visualization allows you to compare spending across categories over the last 12 months. This powerful tool helps you identify trends, spot unusual spending patterns, and make informed financial decisions.
                                </Text>
                                <Stack mb="md" gap={4}>
                                    <Text>• Compare monthly spending across all categories</Text>
                                    <Text>• View data in chronological order with proper month labels</Text>
                                    <Text>• Identify spending trends and patterns</Text>
                                    <Text>• Spot categories with increasing or decreasing spending</Text>
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Card>

                    {/* Spending by Category Over Time Section */}
                    <Card withBorder mb="xl" p="md">
                        <Grid>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Title order={3} mb="md">Spending by Category Over Time</Title>
                                <Text mb="md">
                                    Track your cumulative spending in each category with our area chart visualization. This chart shows how your spending grows over time, making it easy to monitor your financial progress and set realistic budgeting goals.
                                </Text>
                                <Stack mb="md" gap={4}>
                                    <Text>• View cumulative spending growth for each category</Text>
                                    <Text>• Track spending increases with accurate data points</Text>
                                    <Text>• Compare growth rates across different categories</Text>
                                    <Text>• Identify your fastest-growing expense categories</Text>
                                </Stack>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 6 }}>
                                <Center h="100%">
                                    <Image src="/Area_Chart.png" alt="Area Chart" width={300} />
                                </Center>
                            </Grid.Col>
                        </Grid>
                    </Card>
                </Card>

                {/* Login/Register Section */}
                <Card withBorder shadow="sm" p="lg" radius="md" mt="xl" mb="xl">
                    <Stack align="center" gap="lg">
                        <Title order={2} ta="center">Ready to take control of your finances?</Title>
                        <Text size="xl" fw={600} ta="center" mb="md">
                            Register today to get started with QuikChek!
                        </Text>
                        <Text ta="center" mb="lg" maw={600} mx="auto" c="dimmed">
                            Join thousands of users who are already saving time and gaining insights into their spending habits with QuikChek.
                        </Text>
                        <Group gap="xl">
                            <Button variant="filled" size="xl" radius="md" px={40}
                                    styles={(theme) => ({
                                        root: {
                                            boxShadow: theme.shadows.sm,
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: theme.shadows.md,
                                            }
                                        }
                                    })}
                                    onClick={openLogin}>
                                Login
                            </Button>
                            <Button variant="outline" size="xl" radius="md" px={40}
                                    styles={(theme) => ({
                                        root: {
                                            borderWidth: 2,
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-3px)',
                                                boxShadow: theme.shadows.sm,
                                            }
                                        }
                                    })}
                                    onClick={openLogin}>
                                Register
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </div>
        </Container>
    )
};

export default Homepage;