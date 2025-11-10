# Content CRUD Forms and Modals

This directory contains components for creating and editing content with comprehensive form validation, morals management, and final checks functionality.

## Components

### ContentForm

The main form component for creating and editing content.

**Features:**
- Real-time form validation with user-friendly error messages
- Dynamic morals array management (add/remove functionality)
- Final checks management with completion tracking
- Dependency selection dropdowns for publish_after/publish_before
- Responsive design optimized for mobile devices
- Loading states and error handling during form submission

**Props:**
```typescript
interface ContentFormProps {
  content?: Content;           // Content to edit (undefined for create mode)
  isOpen: boolean;            // Whether the modal is open
  onClose: () => void;        // Callback when modal is closed
  onSubmit?: (content: Content) => void; // Callback when form is submitted
}
```

**Usage:**
```tsx
import { ContentForm } from './ContentForm';

<ContentForm
  content={editingContent}
  isOpen={isModalOpen}
  onClose={closeModal}
  onSubmit={handleSubmit}
/>
```

### ContentModal

A wrapper component that provides modal functionality for the ContentForm.

**Props:**
```typescript
interface ContentModalProps {
  content?: Content;
  isOpen: boolean;
  onClose: () => void;
  onContentCreated?: (content: Content) => void;
  onContentUpdated?: (content: Content) => void;
}
```

**Usage:**
```tsx
import { ContentModal } from './ContentModal';

<ContentModal
  content={editingContent}
  isOpen={isModalOpen}
  onClose={closeModal}
  onContentCreated={handleContentCreated}
  onContentUpdated={handleContentUpdated}
/>
```

## Hooks

### useContentForm

A custom hook for managing content form state and operations.

**Returns:**
```typescript
interface UseContentFormReturn {
  isModalOpen: boolean;
  editingContent: Content | undefined;
  openCreateModal: () => void;
  openEditModal: (content: Content) => void;
  closeModal: () => void;
  handleContentCreated: (content: Content) => void;
  handleContentUpdated: (content: Content) => void;
}
```

**Usage:**
```tsx
import { useContentForm } from '../../hooks/useContentForm';

const {
  isModalOpen,
  editingContent,
  openCreateModal,
  openEditModal,
  closeModal,
  handleContentCreated,
  handleContentUpdated
} = useContentForm(
  (content) => console.log('Created:', content),
  (content) => console.log('Updated:', content)
);
```

## Form Validation

The form includes comprehensive validation for all fields:

### Topic Validation
- **Required**: Must not be empty
- **Length**: 3-100 characters
- **Uniqueness**: Must be unique across all content (except when editing existing content)

### Title Validation
- **Length**: Maximum 200 characters
- **Required for stages**: Required when current_stage >= 1

### Script Validation
- **Length**: Minimum 50 characters when provided
- **Required for stages**: Required when current_stage >= 5

### Link Validation
- **Format**: Must be a valid URL when provided
- **Required for stages**: Required when current_stage = 11 (Published)

### Dependencies Validation
- **Self-dependency**: Content cannot depend on itself
- **Circular dependencies**: Cannot have the same content as both publish_after and publish_before
- **Existence**: Referenced content must exist

### Morals Validation
- **Count**: Maximum 10 morals per content
- **Duplicates**: Prevents adding duplicate morals

## Sub-Components

### MoralsInput

Manages the array of morals with add/remove functionality.

**Features:**
- Add morals by typing and pressing Enter or clicking Add button
- Remove morals with individual remove buttons
- Prevents duplicate morals
- Validates maximum count

### FinalChecksManager

Manages final checks for content completion tracking.

**Features:**
- Toggle completion status of existing checks
- Add new final checks dynamically
- Remove unwanted checks
- Visual indication of completed vs incomplete checks

## Integration with Services

The components integrate with:

- **ContentService**: For CRUD operations and validation
- **useContent hook**: For state management
- **useErrorHandler hook**: For error handling and user feedback

## Mobile Optimization

All components are optimized for mobile devices:

- Touch-friendly button sizes (minimum 44px)
- Responsive layout that works on small screens
- Proper viewport handling
- Optimized for touch interactions

## Testing

Comprehensive test suites are provided:

- **ContentForm.test.tsx**: Tests all form functionality, validation, and user interactions
- **ContentModal.test.tsx**: Tests modal behavior and prop passing
- **useContentForm.test.tsx**: Tests hook state management and callbacks
- **contentFormValidation.test.ts**: Tests all validation functions and edge cases

## Example Usage

See `ContentFormExample.tsx` for a complete example of how to use these components together in a real application.

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **3.1**: CRUD operations on content with unique topic validation
- **3.2**: Category selection and data integrity preservation
- **3.6**: Real-time form validation and error handling
- **4.1**: Dependency management for publish_after constraints
- **4.2**: Dependency validation and relationship display
- **11.2**: Dynamic final checks management through UI
- **11.4**: Mobile-first responsive design with touch optimization