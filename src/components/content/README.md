# ContentPipeline Component

The `ContentPipeline` component provides a visual representation of the content production pipeline with interactive stage progression and validation.

## Features

- **Visual Pipeline**: Shows all 12 content stages from Pending to Published
- **Interactive Progression**: Click to advance to the next stage with validation
- **Responsive Design**: Mobile-first design with separate desktop and mobile layouts
- **Stage Validation**: Prevents invalid stage transitions with clear error messages
- **Dependency Warnings**: Shows content dependencies (publish_after/publish_before)
- **Requirements Display**: Shows missing requirements for each stage
- **Progress Tracking**: Visual progress bar and stage indicators
- **Accessibility**: Full ARIA support and keyboard navigation

## Usage

```tsx
import { ContentPipeline } from '@/components/content';
import { Content } from '@/types';

const MyComponent = () => {
  const [content, setContent] = useState<Content>({
    // ... content data
  });

  const handleStageUpdate = async (contentId: string, newStage: number) => {
    try {
      const updatedContent = await ContentService.updateContentStage(contentId, newStage);
      setContent(updatedContent);
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  return (
    <ContentPipeline
      content={content}
      onStageUpdate={handleStageUpdate}
      className="my-custom-class"
    />
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `content` | `Content` | Yes | The content object to display in the pipeline |
| `onStageUpdate` | `(contentId: string, newStage: number) => void \| Promise<void>` | Yes | Callback when user clicks to advance to next stage |
| `className` | `string` | No | Additional CSS classes to apply to the component |

## Content Interface

The component expects a `Content` object with the following structure:

```typescript
interface Content {
  id: string;
  topic: string;
  category: 'Demanding' | 'Innovative';
  current_stage: number; // 0-11 (index in CONTENT_STAGES array)
  title?: string; // required if current_stage >= 1
  script?: string; // required if current_stage >= 5
  final_checks: FinalCheck[];
  publish_after?: string; // content topic dependency
  publish_before?: string; // content topic dependency
  link?: string; // required if current_stage === 11 (Published)
  morals: string[];
  flags: ContentFlag[];
  created_at: string;
  updated_at: string;
}
```

## Content Stages

The pipeline supports 12 stages (0-11):

1. **Pending** (0) - Initial stage
2. **Title** (1) - Requires title field
3. **Thumbnail** (2)
4. **ToC** (3) - Table of Contents
5. **Ordered** (4)
6. **Scripted** (5) - Requires script field
7. **Recorded** (6)
8. **Voice Edited** (7)
9. **Edited** (8)
10. **Revised** (9)
11. **SEO Optimised** (10)
12. **Published** (11) - Requires link field and completed final checks

## Stage Validation Rules

The component enforces the following validation rules:

- **Sequential Progression**: Can only advance one stage at a time
- **No Backwards Movement**: Cannot move to previous stages
- **Field Requirements**: 
  - Title required for stage ≥ 1
  - Script required for stage ≥ 5
  - Link required for Published stage (11)
- **Final Checks**: All final checks must be completed before publishing
- **Dependencies**: Cannot publish if `publish_after` dependency is not published

## Responsive Behavior

### Desktop View (≥768px)
- Horizontal layout with stage indicators in a row
- Tooltips on hover showing stage names and errors
- Compact design optimized for wide screens

### Mobile View (<768px)
- Vertical layout with full-width stage cards
- Touch-friendly interface with larger tap targets
- Requirements and errors shown inline
- Optimized for thumb navigation

## Accessibility Features

- **ARIA Labels**: Each stage has descriptive `aria-label`
- **Keyboard Navigation**: Proper `tabIndex` for focusable elements
- **Screen Reader Support**: `aria-disabled` for non-interactive stages
- **Color Contrast**: High contrast colors for all states
- **Focus Management**: Clear focus indicators

## Styling

The component uses Tailwind CSS classes and follows the design system:

- **Colors**: 
  - Green: Completed stages
  - Blue: Current/active stage
  - Gray: Future/clickable stages
  - Red: Error states
- **Responsive**: Mobile-first approach with `md:` breakpoints
- **Animations**: Smooth transitions for state changes

## Error Handling

The component handles various error scenarios:

- **Validation Errors**: Shows inline error messages for failed validations
- **Network Errors**: Displays error messages from failed API calls
- **Loading States**: Shows loading spinner during stage updates
- **Error Recovery**: Clears errors when validation passes

## Integration with State Management

The component is designed to work with any state management solution:

```tsx
// With React Context
const { updateContent } = useContent();

const handleStageUpdate = async (contentId: string, newStage: number) => {
  const updatedContent = await ContentService.updateContentStage(contentId, newStage);
  updateContent(updatedContent);
};

// With Redux
const dispatch = useDispatch();

const handleStageUpdate = async (contentId: string, newStage: number) => {
  const updatedContent = await ContentService.updateContentStage(contentId, newStage);
  dispatch(updateContentAction(updatedContent));
};
```

## Testing

The component includes comprehensive tests covering:

- Rendering and visual states
- User interactions and stage progression
- Validation and error handling
- Responsive behavior
- Accessibility features
- Edge cases and error scenarios

Run tests with:
```bash
npm test src/components/content/__tests__/ContentPipeline.test.tsx
```

## Performance Considerations

- **Memoization**: Uses `useCallback` for event handlers
- **Conditional Rendering**: Optimized rendering for different states
- **Minimal Re-renders**: Efficient state updates
- **Mobile Optimization**: Lightweight animations and transitions

## Example

See `ContentPipelineExample.tsx` for a complete working example with:
- State management
- Error handling
- Content details display
- Interactive final checks
- Usage instructions