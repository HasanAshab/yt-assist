import { describe, it, expect } from 'vitest';
import type { ContentFormData, Content } from '../../types';
import { VALIDATION_RULES } from '../../constants';

// Validation utility functions that would be used in the ContentForm
export const validateTopic = (topic: string, existingContents: Content[], currentContentTopic?: string): string | undefined => {
  if (!topic || topic.trim().length < VALIDATION_RULES.MIN_TOPIC_LENGTH) {
    return `Topic must be at least ${VALIDATION_RULES.MIN_TOPIC_LENGTH} characters long`;
  }
  
  if (topic.length > VALIDATION_RULES.MAX_TOPIC_LENGTH) {
    return `Topic must be no more than ${VALIDATION_RULES.MAX_TOPIC_LENGTH} characters long`;
  }
  
  // Check uniqueness (skip if it's the same as current content being edited)
  if (topic !== currentContentTopic && existingContents.some(c => c.topic === topic)) {
    return 'A content with this topic already exists';
  }
  
  return undefined;
};

export const validateTitle = (title: string): string | undefined => {
  if (title && title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    return `Title must be no more than ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters long`;
  }
  
  return undefined;
};

export const validateScript = (script: string): string | undefined => {
  if (script && script.length < VALIDATION_RULES.MIN_SCRIPT_LENGTH) {
    return `Script must be at least ${VALIDATION_RULES.MIN_SCRIPT_LENGTH} characters long`;
  }
  
  return undefined;
};

export const validateUrl = (url: string): string | undefined => {
  if (url && url.trim()) {
    try {
      new URL(url);
      return undefined;
    } catch {
      return 'Please enter a valid URL';
    }
  }
  
  return undefined;
};

export const validateDependencies = (
  publishAfter: string,
  publishBefore: string,
  currentTopic: string
): string | undefined => {
  if (publishAfter && publishAfter === currentTopic) {
    return 'Content cannot depend on itself (publish_after)';
  }
  
  if (publishBefore && publishBefore === currentTopic) {
    return 'Content cannot depend on itself (publish_before)';
  }
  
  if (publishAfter && publishBefore && publishAfter === publishBefore) {
    return 'Cannot have the same content as both dependencies';
  }
  
  return undefined;
};

export const validateMorals = (morals: string[]): string | undefined => {
  if (morals.length > VALIDATION_RULES.MAX_MORALS_COUNT) {
    return `Cannot have more than ${VALIDATION_RULES.MAX_MORALS_COUNT} morals`;
  }
  
  return undefined;
};

export const validateFormData = (
  formData: ContentFormData,
  existingContents: Content[],
  currentContentTopic?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Topic validation
  const topicError = validateTopic(formData.topic, existingContents, currentContentTopic);
  if (topicError) errors.topic = topicError;
  
  // Title validation
  const titleError = validateTitle(formData.title || '');
  if (titleError) errors.title = titleError;
  
  // Script validation
  const scriptError = validateScript(formData.script || '');
  if (scriptError) errors.script = scriptError;
  
  // URL validation
  const urlError = validateUrl(formData.link || '');
  if (urlError) errors.link = urlError;
  
  // Dependencies validation
  const dependencyError = validateDependencies(
    formData.publish_after || '',
    formData.publish_before || '',
    formData.topic
  );
  if (dependencyError) {
    errors.publish_after = dependencyError;
    errors.publish_before = dependencyError;
  }
  
  // Morals validation
  const moralsError = validateMorals(formData.morals);
  if (moralsError) errors.morals = moralsError;
  
  // Required field validation
  if (!formData.topic.trim()) {
    errors.topic = 'Topic is required';
  }
  
  if (!formData.category) {
    errors.category = 'Category is required';
  }
  
  return errors;
};

describe('Content Form Validation', () => {
  const mockContents: Content[] = [
    {
      id: '1',
      topic: 'Existing Topic',
      category: 'Demanding',
      current_stage: 0,
      title: 'Existing Title',
      script: '',
      final_checks: [],
      publish_after: '',
      publish_before: '',
      link: '',
      morals: [],
      flags: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  ];

  describe('validateTopic', () => {
    it('validates minimum length', () => {
      const result = validateTopic('ab', mockContents);
      expect(result).toBe('Topic must be at least 3 characters long');
    });

    it('validates maximum length', () => {
      const longTopic = 'a'.repeat(VALIDATION_RULES.MAX_TOPIC_LENGTH + 1);
      const result = validateTopic(longTopic, mockContents);
      expect(result).toBe(`Topic must be no more than ${VALIDATION_RULES.MAX_TOPIC_LENGTH} characters long`);
    });

    it('validates uniqueness for new content', () => {
      const result = validateTopic('Existing Topic', mockContents);
      expect(result).toBe('A content with this topic already exists');
    });

    it('allows same topic when editing existing content', () => {
      const result = validateTopic('Existing Topic', mockContents, 'Existing Topic');
      expect(result).toBeUndefined();
    });

    it('passes valid topic', () => {
      const result = validateTopic('Valid Topic', mockContents);
      expect(result).toBeUndefined();
    });

    it('handles empty topic', () => {
      const result = validateTopic('', mockContents);
      expect(result).toBe('Topic must be at least 3 characters long');
    });

    it('handles whitespace-only topic', () => {
      const result = validateTopic('   ', mockContents);
      expect(result).toBe('Topic must be at least 3 characters long');
    });
  });

  describe('validateTitle', () => {
    it('validates maximum length', () => {
      const longTitle = 'a'.repeat(VALIDATION_RULES.MAX_TITLE_LENGTH + 1);
      const result = validateTitle(longTitle);
      expect(result).toBe(`Title must be no more than ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters long`);
    });

    it('passes valid title', () => {
      const result = validateTitle('Valid Title');
      expect(result).toBeUndefined();
    });

    it('passes empty title', () => {
      const result = validateTitle('');
      expect(result).toBeUndefined();
    });
  });

  describe('validateScript', () => {
    it('validates minimum length when script is provided', () => {
      const shortScript = 'a'.repeat(VALIDATION_RULES.MIN_SCRIPT_LENGTH - 1);
      const result = validateScript(shortScript);
      expect(result).toBe(`Script must be at least ${VALIDATION_RULES.MIN_SCRIPT_LENGTH} characters long`);
    });

    it('passes valid script', () => {
      const validScript = 'a'.repeat(VALIDATION_RULES.MIN_SCRIPT_LENGTH);
      const result = validateScript(validScript);
      expect(result).toBeUndefined();
    });

    it('passes empty script', () => {
      const result = validateScript('');
      expect(result).toBeUndefined();
    });
  });

  describe('validateUrl', () => {
    it('validates invalid URL format', () => {
      const result = validateUrl('invalid-url');
      expect(result).toBe('Please enter a valid URL');
    });

    it('passes valid URL', () => {
      const result = validateUrl('https://example.com');
      expect(result).toBeUndefined();
    });

    it('passes empty URL', () => {
      const result = validateUrl('');
      expect(result).toBeUndefined();
    });

    it('passes whitespace-only URL', () => {
      const result = validateUrl('   ');
      expect(result).toBeUndefined();
    });

    it('validates various URL formats', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://www.example.com/path?query=value',
        'ftp://files.example.com',
        'https://subdomain.example.co.uk'
      ];

      validUrls.forEach(url => {
        expect(validateUrl(url)).toBeUndefined();
      });
    });
  });

  describe('validateDependencies', () => {
    it('prevents self-dependency in publish_after', () => {
      const result = validateDependencies('My Topic', '', 'My Topic');
      expect(result).toBe('Content cannot depend on itself (publish_after)');
    });

    it('prevents self-dependency in publish_before', () => {
      const result = validateDependencies('', 'My Topic', 'My Topic');
      expect(result).toBe('Content cannot depend on itself (publish_before)');
    });

    it('prevents circular dependencies', () => {
      const result = validateDependencies('Other Topic', 'Other Topic', 'My Topic');
      expect(result).toBe('Cannot have the same content as both dependencies');
    });

    it('passes valid dependencies', () => {
      const result = validateDependencies('Topic A', 'Topic B', 'My Topic');
      expect(result).toBeUndefined();
    });

    it('passes empty dependencies', () => {
      const result = validateDependencies('', '', 'My Topic');
      expect(result).toBeUndefined();
    });
  });

  describe('validateMorals', () => {
    it('validates maximum count', () => {
      const tooManyMorals = Array(VALIDATION_RULES.MAX_MORALS_COUNT + 1).fill('moral');
      const result = validateMorals(tooManyMorals);
      expect(result).toBe(`Cannot have more than ${VALIDATION_RULES.MAX_MORALS_COUNT} morals`);
    });

    it('passes valid morals count', () => {
      const validMorals = Array(VALIDATION_RULES.MAX_MORALS_COUNT).fill('moral');
      const result = validateMorals(validMorals);
      expect(result).toBeUndefined();
    });

    it('passes empty morals array', () => {
      const result = validateMorals([]);
      expect(result).toBeUndefined();
    });
  });

  describe('validateFormData', () => {
    const validFormData: ContentFormData = {
      topic: 'Valid Topic',
      category: 'Demanding',
      title: 'Valid Title',
      script: 'a'.repeat(VALIDATION_RULES.MIN_SCRIPT_LENGTH),
      publish_after: '',
      publish_before: '',
      link: 'https://example.com',
      morals: ['moral1', 'moral2']
    };

    it('passes completely valid form data', () => {
      const errors = validateFormData(validFormData, mockContents);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('validates required fields', () => {
      const invalidFormData: ContentFormData = {
        topic: '',
        category: 'Demanding',
        title: '',
        script: '',
        publish_after: '',
        publish_before: '',
        link: '',
        morals: []
      };

      const errors = validateFormData(invalidFormData, mockContents);
      expect(errors.topic).toBe('Topic is required');
    });

    it('validates multiple fields with errors', () => {
      const invalidFormData: ContentFormData = {
        topic: 'ab', // Too short
        category: 'Demanding',
        title: 'a'.repeat(VALIDATION_RULES.MAX_TITLE_LENGTH + 1), // Too long
        script: 'short', // Too short
        publish_after: '',
        publish_before: '',
        link: 'invalid-url', // Invalid URL
        morals: Array(VALIDATION_RULES.MAX_MORALS_COUNT + 1).fill('moral') // Too many
      };

      const errors = validateFormData(invalidFormData, mockContents);
      
      expect(errors.topic).toBe('Topic must be at least 3 characters long');
      expect(errors.title).toBe(`Title must be no more than ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters long`);
      expect(errors.script).toBe(`Script must be at least ${VALIDATION_RULES.MIN_SCRIPT_LENGTH} characters long`);
      expect(errors.link).toBe('Please enter a valid URL');
      expect(errors.morals).toBe(`Cannot have more than ${VALIDATION_RULES.MAX_MORALS_COUNT} morals`);
    });

    it('validates dependencies correctly', () => {
      const formDataWithCircularDep: ContentFormData = {
        ...validFormData,
        topic: 'My Topic',
        publish_after: 'Other Topic',
        publish_before: 'Other Topic'
      };

      const errors = validateFormData(formDataWithCircularDep, mockContents);
      expect(errors.publish_after).toBe('Cannot have the same content as both dependencies');
      expect(errors.publish_before).toBe('Cannot have the same content as both dependencies');
    });

    it('handles editing existing content', () => {
      const formDataWithExistingTopic: ContentFormData = {
        ...validFormData,
        topic: 'Existing Topic'
      };

      // Should fail for new content
      const errorsNew = validateFormData(formDataWithExistingTopic, mockContents);
      expect(errorsNew.topic).toBe('A content with this topic already exists');

      // Should pass when editing the same content
      const errorsEdit = validateFormData(formDataWithExistingTopic, mockContents, 'Existing Topic');
      expect(errorsEdit.topic).toBeUndefined();
    });

    it('handles missing category', () => {
      const formDataWithoutCategory: ContentFormData = {
        ...validFormData,
        category: '' as any
      };

      const errors = validateFormData(formDataWithoutCategory, mockContents);
      expect(errors.category).toBe('Category is required');
    });
  });

  describe('Edge Cases', () => {
    it('handles null and undefined values gracefully', () => {
      expect(validateTitle(undefined as any)).toBeUndefined();
      expect(validateScript(null as any)).toBeUndefined();
      expect(validateUrl(undefined as any)).toBeUndefined();
    });

    it('handles special characters in topic', () => {
      const topicWithSpecialChars = 'Topic with @#$%^&*()';
      const result = validateTopic(topicWithSpecialChars, mockContents);
      expect(result).toBeUndefined();
    });

    it('handles unicode characters', () => {
      const unicodeTopic = 'Topic with émojis 🚀 and ñ';
      const result = validateTopic(unicodeTopic, mockContents);
      expect(result).toBeUndefined();
    });

    it('handles very long content arrays', () => {
      const manyContents = Array(1000).fill(null).map((_, i) => ({
        ...mockContents[0],
        id: `${i}`,
        topic: `Topic ${i}`
      }));

      const result = validateTopic('New Topic', manyContents);
      expect(result).toBeUndefined();
    });
  });
});