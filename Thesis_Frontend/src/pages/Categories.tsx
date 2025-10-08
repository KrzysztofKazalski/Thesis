import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Card, Text, Group, Stack, Title, Container, Button, TextInput, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import SpendingCategory from '../Models/SpendingCategory.tsx';
import { useForm } from '@mantine/form';
import {LOCAL_HOST_API_URL} from "../utility/AppConstants.tsx";

const Categories = () => {
    const [categories, setCategories] = useState<SpendingCategory[]>([]);
    const [error, setError] = useState<string | null>(null);
    const { user } = useContext(AuthContext);
    const [categoryFormOpened, { open: openCategoryForm, close: closeCategoryForm }] = useDisclosure(false);
    const [editCategoryFormOpened, { open: openEditCategoryForm, close: closeEditCategoryForm }] = useDisclosure(false);

    useEffect(() => {
        fetchCategories().catch((error) => console.error("Error in fetchCategories:", error));
    }, [user]);

    const fetchCategories = async () => {
        if (!user) return;

        try {
            const response = await axios.get(`${LOCAL_HOST_API_URL}/SpendingCategories/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });
            setCategories(response.data);
        } catch (err) {
            setError('Failed to fetch categories');
            console.error('Error fetching categories:', err);
            notifications.show({
                message: 'Error loading categories',
                color: "red",
            });
        }
    };

    const categoryForm = useForm({
        initialValues: {
            name: '',
        },
        validate: {
            name: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return 'Please fill out this field.';
                }
                if (!/^[a-zA-Z\s]+$/.test(value)) {
                    return 'Category name can only contain letters and spaces';
                }
                if (value.length < 4 || value.length > 30) {
                    return 'Category name must be between 4 and 30 characters';
                }

                
                // Check for duplicate category names
                const duplicateCategory = categories.find(
                    category => category.name.toLowerCase() === value.toLowerCase()
                );
                if (duplicateCategory) {
                    return 'A category with this name already exists';
                }
                
                return null;
            },
        },
    });

    const editCategoryForm = useForm({
        initialValues: {
            name: '',
            id: 0,
        },
        validate: {
            name: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return 'Please fill out this field.';
                }
                if (!/^[a-zA-Z\s]+$/.test(value)) {
                    return 'Category name can only contain letters and spaces';
                }
                if (value.length < 4 || value.length > 30) {
                    return 'Category name must be between 4 and 30 characters';
                }
                
                // Check for duplicate category names (excluding the current category being edited)
                const duplicateCategory = categories.find(
                    category => category.name.toLowerCase() === value.toLowerCase() && 
                    category.id !== editCategoryForm.values.id
                );
                if (duplicateCategory) {
                    return 'A category with this name already exists';
                }
                
                return null;
            },
        },
    });

    const handleSubmit = async (values: { name: string }) => {
        if (!user) return;

        try {
            const response = await axios.post(`${LOCAL_HOST_API_URL}/SpendingCategories`, {
                name: values.name,
                userId: user.id
            }, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                }
            });

            notifications.show({
                message: 'Category created successfully!'
            });

            // Add the new category to the list
            const newCategory = response.data;
            setCategories([...categories, newCategory]);

            // Close the form and reset it
            closeCategoryForm();
            categoryForm.reset();
        } catch (e) {
            console.error('Error during category creation:', e);
            notifications.show({
                message: 'Error creating category',
                color: "red",
            });
        }
    };

    const handleEditSubmit = async (values: { name: string, id: number }) => {
        if (!user) return;

        try {
            const response = await axios.put(`${LOCAL_HOST_API_URL}/SpendingCategories/${values.id}`, {
                id: values.id,
                name: values.name,
                userId: user.id
            }, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                }
            });

            notifications.show({
                message: 'Category updated successfully!'
            });

            // Update the category in the list
            const updatedCategory = response.data;
            setCategories(categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));

            // Close the form
            closeEditCategoryForm();
        } catch (e) {
            console.error('Error during category update:', e);
            notifications.show({
                message: 'Error updating category',
                color: "red",
            });
        }
    };

    const handleEditCategory = (category: SpendingCategory) => {
        editCategoryForm.setValues({
            name: category.name,
            id: category.id
        });
        openEditCategoryForm();
    };

    const handleDeleteCategory = async (categoryId: number) => {
        if (!user) return;

        try {
            await axios.delete(`${LOCAL_HOST_API_URL}/SpendingCategories/${categoryId}`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            // Remove the deleted category from the list
            setCategories(categories.filter(cat => cat.id !== categoryId));

            notifications.show({
                message: 'Category deleted successfully!'
            });
        } catch (err) {
            console.error('Error deleting category:', err);
            notifications.show({
                message: 'The category is currently in use and cannot be deleted',
                color: "red",
            });
        }
    };

    if (error) return <Text>{error}</Text>;

    return (
        <>
            {/* Create Category Modal */}
            <Modal opened={categoryFormOpened} onClose={closeCategoryForm} title="Create New Category">
                <form onSubmit={categoryForm.onSubmit(handleSubmit)}>
                    <TextInput
                        required
                        label="Category Name"
                        placeholder="Enter category name"
                        {...categoryForm.getInputProps('name', { type: 'input' })}
                        withAsterisk
                    />
                    <Group justify="flex-end" mt="md">
                        <Button type="submit">Create Category</Button>
                    </Group>
                </form>
            </Modal>

            {/* Edit Category Modal */}
            <Modal opened={editCategoryFormOpened} onClose={closeEditCategoryForm} title="Edit Category">
                <form onSubmit={editCategoryForm.onSubmit(handleEditSubmit)}>
                    <TextInput
                        required
                        label="Category Name"
                        placeholder="Enter category name"
                        {...editCategoryForm.getInputProps('name', { type: 'input' })}
                        withAsterisk
                    />
                    <Group justify="flex-end" mt="md">
                        <Button type="submit">Update Category</Button>
                    </Group>
                </form>
            </Modal>

            <Container>
                <Group justify="space-between">
                    <Title order={2} mb="xl">Categories</Title>
                    <Button onClick={openCategoryForm} mb="xl" size="md">New Category</Button>
                </Group>

                <Stack>
                    {categories.length === 0 ? (
                        <Text c="dimmed" ta="center" mt="md">
                            You don't have any categories yet. Create your first category to start organizing your expenses.
                        </Text>
                    ) : (
                        categories.map((category) => (
                            <Card
                                key={category.id}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                            >
                                <Group justify="space-between" align="center">
                                    <Text fw={500}>{category.name}</Text>
                                    {category.name !== "Other" && (
                                    <Stack gap={8}>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            color="blue"
                                            radius="md"
                                            onClick={() => handleEditCategory(category)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="light"
                                            size="sm"
                                            color="red"
                                            radius="md"
                                            onClick={() => handleDeleteCategory(category.id)}
                                        >
                                            Delete
                                        </Button>
                                    </Stack>
                                    )}
                                </Group>
                            </Card>
                        ))
                    )}
                </Stack>
            </Container>
        </>
    );
};

export default Categories;