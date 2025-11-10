# Publication Suggestions System

This module implements the publication suggestion system for YTAssist, providing intelligent recommendations for which content to prioritize for publication.

## Overview

The publication suggestion system analyzes all non-published content and recommends the top 2 contents that are closest to being ready for publication. It considers content stage, completeness, dependencies, and other factors to calculate readiness scores.

## Components

### PublicationSuggestions

The main React component that displays publication suggestions with a rich UI.

**Features:**
- Shows top 2 content suggestions ranked by readiness score
- Visual progress indicators and stage information
- Requirements status (title, script, link, final checks)
- Dependency blocking indicators
- Manual refresh capability
- Loading and error states
- Responsive design for mobile and desktop

**Props:**
```typescript
interface PublicationSuggestionsProps {
  onContentSelect?: (contentId: string) => void;
  onRefresh?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { PublicationSuggestions } from '@/components/suggestions';

<PublicationSuggestions
  onContentSelect={(id) => navigate(`/content/${id}/edit`)}
  onRefresh={() => showToast('Suggestions updated')}
  className="max-w-2xl"
/>
```

## Services

### SuggestionService

Core service class that implements the suggestion algorithm and business logic.

**Key Methods:**

#### `getPublicationSuggestions(): Promise<ContentSuggestion[]>`
Returns top 2 publication suggestions based on readiness scores.

#### `getContentSuggestion(topic: string): Promise<ContentSuggestion | null>`
Gets suggestion data for a specific content by topic.

#### `isContentReadyForNextStage(content: Content): Promise<boolean>`
Checks if content meets requirements to advance to the next stage.

#### `getSuggestionStatistics(): Promise<SuggestionStatistics>`
Returns statistics about suggestion eligibility and readiness.

**Algorithm Details:**

The readiness score is calculated based on:
- **Base Score (0-100):** Current stage progress toward publication
- **Field Bonuses:** +5 for title, +10 for script, +15 for link
- **Final Check Bonus:** Up to +20 based on completion percentage
- **Penalties:** -10 to -20 for missing required fields at current stage

**Dependency Handling:**
- Contents with `publish_after` dependencies are excluded unless the dependency is published
- Missing dependencies result in exclusion from suggestions
- Circular dependencies are prevented during content creation

## Hooks

### useSuggestions

Custom React hook for managing suggestion state and operations.

**Features:**
- Automatic loading of suggestions and statistics
- Manual refresh capability
- Auto-refresh option (every 30 seconds)
- Error handling and loading states
- Individual content suggestion lookup

**Usage:**
```tsx
import { useSuggestions } from '@/hooks';

const MyComponent = () => {
  const {
    suggestions,
    loading,
    error,
    refreshSuggestions,
    getSuggestionForContent,
    statistics
  } = useSuggestions(true); // Enable auto-refresh

  // Use suggestions data...
};
```

**Return Type:**
```typescript
interface UseSuggestionsReturn {
  suggestions: ContentSuggestion[];
  loading: boolean;
  error: string | null;
  refreshSuggestions: () => Promise<void>;
  getSuggestionForContent: (topic: string) => Promise<ContentSuggestion | null>;
  statistics: SuggestionStatistics | null;
}
```

## Types

### ContentSuggestion

```typescript
interface ContentSuggestion {
  content: Content;
  score: number;           // Readiness score (0-150)
  remainingSteps: number;  // Steps to publication
  blockedBy: string[];     // Blocking dependencies
}
```

### SuggestionStatistics

```typescript
interface SuggestionStatistics {
  totalEligible: number;
  readyToAdvance: number;
  blockedByDependencies: number;
  averageReadinessScore: number;
  topSuggestions: number;
}
```

## Requirements Mapping

This implementation satisfies the following requirements:

- **5.1:** Display top 2 contents closest to Published stage
- **5.2:** Only include content with no publish_after dependencies OR whose dependencies are Published
- **5.3:** Show current stage and remaining steps for each suggested content
- **5.3:** Implement suggestion refresh on content updates

## Integration Examples

### Dashboard Integration

```tsx
// Dashboard.tsx
import { PublicationSuggestions } from '@/components/suggestions';

const Dashboard = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <MetricsCard className="lg:col-span-2" />
    <PublicationSuggestions />
  </div>
);
```

### Content Management Integration

```tsx
// ContentManager.tsx
import { useSuggestions } from '@/hooks';

const ContentManager = () => {
  const { suggestions, refreshSuggestions } = useSuggestions();
  
  const handleContentUpdate = async (content: Content) => {
    await updateContent(content);
    await refreshSuggestions(); // Refresh suggestions after update
  };
  
  // Component implementation...
};
```

### Custom Suggestion Display

```tsx
// CustomSuggestions.tsx
import { useSuggestions } from '@/hooks';

const CustomSuggestions = () => {
  const { suggestions, statistics } = useSuggestions();
  
  return (
    <div>
      <h2>Ready to Publish ({statistics?.topSuggestions || 0})</h2>
      {suggestions.map(suggestion => (
        <SuggestionCard key={suggestion.content.id} suggestion={suggestion} />
      ))}
    </div>
  );
};
```

## Testing

The module includes comprehensive tests:

- **Unit Tests:** Service methods and algorithm logic
- **Integration Tests:** End-to-end suggestion workflow
- **Component Tests:** UI behavior and user interactions
- **Hook Tests:** State management and side effects

Run tests with:
```bash
npm test src/services/__tests__/suggestion.service.integration.test.ts
npm test src/components/suggestions/__tests__/
npm test src/hooks/__tests__/useSuggestions.test.tsx
```

## Performance Considerations

- **Caching:** Suggestions are cached in component state
- **Debouncing:** Auto-refresh prevents excessive API calls
- **Lazy Loading:** Component-level code splitting supported
- **Error Boundaries:** Graceful error handling prevents crashes
- **Memory Management:** Proper cleanup of intervals and subscriptions

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Scoring:** Machine learning-based readiness prediction
2. **User Preferences:** Customizable suggestion criteria
3. **Batch Operations:** Bulk actions on suggested content
4. **Analytics:** Track suggestion accuracy and user actions
5. **Notifications:** Push notifications for high-priority suggestions
6. **Collaboration:** Team-based suggestion sharing and comments