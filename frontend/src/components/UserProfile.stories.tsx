import { Meta, StoryObj } from '@storybook/react-vite';
import { within, userEvent } from '@storybook/testing-library';
import { expect } from '@storybook/jest';
import UserProfile from './UserProfile';

const meta: Meta<typeof UserProfile> = {
  title: 'Components/UserProfile',
  component: UserProfile,
};
export default meta;

type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {
  args: {
    user: {
      id: 'user_1',
      name: 'Alice',
      email: 'alice@example.com',
      verified: true,
      role: 'User',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check if user info is displayed correctly
    await expect(canvas.getByText('Alice')).toBeInTheDocument();
    await expect(canvas.getByText('alice@example.com')).toBeInTheDocument();

    // Find the edit button
    const editButton = canvas.getByRole('button', { name: /edit/i });

    // Click the edit button to enter edit mode
    await userEvent.click(editButton);

    // Check if form fields appear
    const nameInput = canvas.getByDisplayValue('Alice');
    await expect(nameInput).toBeInTheDocument();

    // Edit the name
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Alice Smith');

    // Submit the form
    const saveButton = canvas.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);
  },
};

export const Unverified: Story = {
  args: {
    user: {
      id: 'user_2',
      name: 'Bob',
      email: 'bob@example.com',
      verified: false,
      role: 'User',
    },
  },
};

export const EditMode: Story = {
  args: {
    user: {
      id: 'user_3',
      name: 'Charlie',
      email: 'charlie@example.com',
      verified: true,
      role: 'Admin',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Switch to edit mode
    const editButton = await canvas.getByRole('button', { name: /edit/i });
    userEvent.click(editButton);

    // Fill out the form
    const nameInput = await canvas.getByLabelText(/name/i);
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'Updated Charlie');

    const emailInput = await canvas.getByLabelText(/email/i);
    userEvent.clear(emailInput);
    userEvent.type(emailInput, 'updated_charlie@example.com');

    // Submit the form
    const submitButton = await canvas.getByRole('button', { name: /save/i });
    userEvent.click(submitButton);

    // Assert the changes
    expect(nameInput).toHaveValue('Updated Charlie');
    expect(emailInput).toHaveValue('updated_charlie@example.com');
  },
};
