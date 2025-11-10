import { supabase, handleSupabaseError } from './supabase';
import { CONTENT_STAGES, STAGE_REQUIREMENTS, DEFAULT_FINAL_CHECKS, VALIDATION_RULES } from '@/constants';
import type { 
  Content, 
  ContentFilters, 
  ValidationResult, 
  ContentFormData,
  FinalCheck,
  SortOptions,
  ContentDependency,
  ContentFlag
} from '@/types';
import type { Database } from './database.types';

type ContentRow = Database['public']['Tables']['contents']['Row'];
type ContentInsert = Database['public']['Tables']['contents']['Insert'];
type ContentUpdate = Database['public']['Tables']['contents']['Update'];

/**
 * Content management service with CRUD operations, validation, and filtering
 */
export class ContentService {
  /**
   * Get all contents with optional filtering and sorting
   */
  static async getContents(
    filters?: ContentFilters,
    sortOptions?: SortOptions
  ): Promise<Content[]> {
    try {
      let query = supabase
        .from('contents')
        .select('*');

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.stage !== undefined) {
        query = query.eq('current_stage', filters.stage);
      }

      if (filters?.search) {
        query = query.ilike('topic', `%${filters.search}%`);
      }

      // Apply sorting
      if (sortOptions) {
        query = query.order(sortOptions.field, { 
          ascending: sortOptions.direction === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(this.mapRowToContent);
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Get content by ID
   */
  static async getContentById(id: string): Promise<Content | null> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapRowToContent(data) : null;
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Get content by topic (unique identifier)
   */
  static async getContentByTopic(topic: string): Promise<Content | null> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('topic', topic)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? this.mapRowToContent(data) : null;
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Create new content with validation
   */
  static async createContent(contentData: ContentFormData): Promise<Content> {
    // Validate content data
    const validation = await this.validateContentData(contentData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for topic uniqueness
    const existingContent = await this.getContentByTopic(contentData.topic);
    if (existingContent) {
      throw new Error(`Content with topic "${contentData.topic}" already exists`);
    }

    // Validate dependencies
    const dependencyValidation = await this.validateDependencies(
      contentData.publish_after,
      contentData.publish_before
    );
    if (!dependencyValidation.isValid) {
      throw new Error(`Dependency validation failed: ${dependencyValidation.errors.join(', ')}`);
    }

    try {
      const insertData: ContentInsert = {
        topic: contentData.topic,
        category: contentData.category,
        current_stage: 0, // Always start at Pending
        title: contentData.title || null,
        script: contentData.script || null,
        final_checks: this.createDefaultFinalChecks(),
        publish_after: contentData.publish_after || null,
        publish_before: contentData.publish_before || null,
        link: contentData.link || null,
        morals: contentData.morals || [],
        flags: []
      };

      const { data, error } = await supabase
        .from('contents')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return this.mapRowToContent(data);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update existing content with validation
   */
  static async updateContent(id: string, updates: Partial<ContentFormData>): Promise<Content> {
    // Get existing content
    const existingContent = await this.getContentById(id);
    if (!existingContent) {
      throw new Error('Content not found');
    }

    // Merge updates with existing data
    const updatedData: ContentFormData = {
      topic: updates.topic ?? existingContent.topic,
      category: updates.category ?? existingContent.category,
      title: updates.title ?? existingContent.title,
      script: updates.script ?? existingContent.script,
      publish_after: updates.publish_after ?? existingContent.publish_after,
      publish_before: updates.publish_before ?? existingContent.publish_before,
      link: updates.link ?? existingContent.link,
      morals: updates.morals ?? existingContent.morals
    };

    // Validate updated data
    const validation = await this.validateContentData(updatedData, existingContent.current_stage);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check topic uniqueness if topic is being changed
    if (updates.topic && updates.topic !== existingContent.topic) {
      const existingWithTopic = await this.getContentByTopic(updates.topic);
      if (existingWithTopic) {
        throw new Error(`Content with topic "${updates.topic}" already exists`);
      }
    }

    // Validate dependencies
    const dependencyValidation = await this.validateDependencies(
      updatedData.publish_after,
      updatedData.publish_before,
      existingContent.topic
    );
    if (!dependencyValidation.isValid) {
      throw new Error(`Dependency validation failed: ${dependencyValidation.errors.join(', ')}`);
    }

    try {
      const updateData: ContentUpdate = {
        topic: updates.topic,
        category: updates.category,
        title: updates.title || null,
        script: updates.script || null,
        publish_after: updates.publish_after || null,
        publish_before: updates.publish_before || null,
        link: updates.link || null,
        morals: updates.morals,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof ContentUpdate] === undefined) {
          delete updateData[key as keyof ContentUpdate];
        }
      });

      const { data, error } = await supabase
        .from('contents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapRowToContent(data);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update content stage with validation
   */
  static async updateContentStage(id: string, newStage: number): Promise<Content> {
    const content = await this.getContentById(id);
    if (!content) {
      throw new Error('Content not found');
    }

    // Validate stage transition
    const stageValidation = this.validateStageRequirements(content, newStage);
    if (!stageValidation.isValid) {
      throw new Error(`Stage validation failed: ${stageValidation.errors.join(', ')}`);
    }

    // Check dependencies for Published stage
    if (newStage === CONTENT_STAGES.length - 1) { // Published stage
      const dependencyValidation = await this.validatePublishDependencies(content);
      if (!dependencyValidation.isValid) {
        throw new Error(`Cannot publish: ${dependencyValidation.errors.join(', ')}`);
      }
    }

    try {
      const { data, error } = await supabase
        .from('contents')
        .update({ 
          current_stage: newStage,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapRowToContent(data);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Bulk delete published contents
   */
  static async bulkDeletePublishedContents(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .delete()
        .eq('current_stage', CONTENT_STAGES.length - 1) // Published stage
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      handleSupabaseError(error);
      return 0;
    }
  }

  /**
   * Search contents by topic
   */
  static async searchContents(searchTerm: string): Promise<Content[]> {
    if (!searchTerm.trim()) {
      return this.getContents();
    }

    return this.getContents({ search: searchTerm.trim() });
  }

  /**
   * Filter contents by category and stage
   */
  static async filterContents(filters: ContentFilters): Promise<Content[]> {
    return this.getContents(filters);
  }

  /**
   * Get content dependencies (what this content depends on and what depends on it)
   */
  static async getContentDependencies(topic: string): Promise<ContentDependency> {
    try {
      const [dependsOnResult, dependentsResult] = await Promise.all([
        // What this content depends on
        supabase
          .from('contents')
          .select('publish_after')
          .eq('topic', topic)
          .single(),
        // What depends on this content
        supabase
          .from('contents')
          .select('topic')
          .eq('publish_after', topic)
      ]) as [any, any];

      const dependsOn: string[] = [];
      if (dependsOnResult.data?.publish_after) {
        dependsOn.push(dependsOnResult.data.publish_after);
      }

      const dependents = (dependentsResult.data || []).map((item: any) => item.topic);

      return {
        id: `dep_${topic}`,
        contentTopic: topic,
        dependsOn,
        dependent: dependents.join(',')
      };
    } catch (error) {
      handleSupabaseError(error);
      return {
        id: `dep_${topic}`,
        contentTopic: topic,
        dependsOn: [],
        dependent: ''
      };
    }
  }

  /**
   * Validate content data
   */
  static async validateContentData(
    data: ContentFormData, 
    currentStage: number = 0
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Topic validation
    if (!data.topic || data.topic.trim().length < VALIDATION_RULES.MIN_TOPIC_LENGTH) {
      errors.push(`Topic must be at least ${VALIDATION_RULES.MIN_TOPIC_LENGTH} characters long`);
    }
    if (data.topic && data.topic.length > VALIDATION_RULES.MAX_TOPIC_LENGTH) {
      errors.push(`Topic must be no more than ${VALIDATION_RULES.MAX_TOPIC_LENGTH} characters long`);
    }

    // Title validation (required for stage >= 1)
    if (currentStage >= STAGE_REQUIREMENTS.TITLE_REQUIRED_STAGE) {
      if (!data.title || data.title.trim().length < VALIDATION_RULES.MIN_TITLE_LENGTH) {
        errors.push(`Title is required and must be at least ${VALIDATION_RULES.MIN_TITLE_LENGTH} characters long`);
      }
      if (data.title && data.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
        errors.push(`Title must be no more than ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters long`);
      }
    }

    // Script validation (required for stage >= 5)
    if (currentStage >= STAGE_REQUIREMENTS.SCRIPT_REQUIRED_STAGE) {
      if (!data.script || data.script.trim().length < VALIDATION_RULES.MIN_SCRIPT_LENGTH) {
        errors.push(`Script is required and must be at least ${VALIDATION_RULES.MIN_SCRIPT_LENGTH} characters long`);
      }
    }

    // Link validation (required for Published stage)
    if (currentStage >= STAGE_REQUIREMENTS.LINK_REQUIRED_STAGE) {
      if (!data.link || !data.link.trim()) {
        errors.push('Link is required for published content');
      }
      if (data.link && !this.isValidUrl(data.link)) {
        errors.push('Link must be a valid URL');
      }
    }

    // Category validation
    if (!data.category || !['Demanding', 'Innovative'].includes(data.category)) {
      errors.push('Category must be either "Demanding" or "Innovative"');
    }

    // Morals validation
    if (data.morals && data.morals.length > VALIDATION_RULES.MAX_MORALS_COUNT) {
      errors.push(`Cannot have more than ${VALIDATION_RULES.MAX_MORALS_COUNT} morals`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate stage requirements
   */
  static validateStageRequirements(content: Content, targetStage: number): ValidationResult {
    const errors: string[] = [];

    // Cannot go backwards in stages
    if (targetStage < content.current_stage) {
      errors.push('Cannot move to a previous stage');
    }

    // Cannot skip stages
    if (targetStage > content.current_stage + 1) {
      errors.push('Cannot skip stages - must progress one stage at a time');
    }

    // Stage-specific validations
    if (targetStage >= STAGE_REQUIREMENTS.TITLE_REQUIRED_STAGE && !content.title) {
      errors.push('Title is required to advance to this stage');
    }

    if (targetStage >= STAGE_REQUIREMENTS.SCRIPT_REQUIRED_STAGE && !content.script) {
      errors.push('Script is required to advance to this stage');
    }

    if (targetStage >= STAGE_REQUIREMENTS.LINK_REQUIRED_STAGE && !content.link) {
      errors.push('Link is required to advance to Published stage');
    }

    // Final checks validation for Published stage
    if (targetStage >= STAGE_REQUIREMENTS.FINAL_CHECKS_REQUIRED_STAGE) {
      const incompleteFinalChecks = content.final_checks.filter(check => !check.completed);
      if (incompleteFinalChecks.length > 0) {
        errors.push('All final checks must be completed before publishing');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate publish dependencies
   */
  static async validatePublishDependencies(content: Content): Promise<ValidationResult> {
    const errors: string[] = [];

    if (content.publish_after) {
      const dependency = await this.getContentByTopic(content.publish_after);
      if (!dependency) {
        errors.push(`Dependency "${content.publish_after}" not found`);
      } else if (dependency.current_stage < CONTENT_STAGES.length - 1) {
        errors.push(`Cannot publish until "${content.publish_after}" is published`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate content dependencies
   */
  static async validateDependencies(
    publishAfter?: string,
    publishBefore?: string,
    currentTopic?: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Normalize empty strings to undefined
    const normalizedPublishAfter = publishAfter?.trim() || undefined;
    const normalizedPublishBefore = publishBefore?.trim() || undefined;

    // Check publish_after dependency exists
    if (normalizedPublishAfter) {
      const dependency = await this.getContentByTopic(normalizedPublishAfter);
      if (!dependency) {
        errors.push(`Dependency "${normalizedPublishAfter}" does not exist`);
      }
    }

    // Check publish_before dependency exists
    if (normalizedPublishBefore) {
      const dependency = await this.getContentByTopic(normalizedPublishBefore);
      if (!dependency) {
        errors.push(`Dependency "${normalizedPublishBefore}" does not exist`);
      }
    }

    // Prevent circular dependencies
    if (normalizedPublishAfter && normalizedPublishBefore && normalizedPublishAfter === normalizedPublishBefore) {
      errors.push('Cannot have the same content as both publish_after and publish_before');
    }

    // Prevent self-dependency
    if (currentTopic) {
      if (normalizedPublishAfter === currentTopic) {
        errors.push('Content cannot depend on itself (publish_after)');
      }
      if (normalizedPublishBefore === currentTopic) {
        errors.push('Content cannot depend on itself (publish_before)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create default final checks for new content
   */
  private static createDefaultFinalChecks(): FinalCheck[] {
    return DEFAULT_FINAL_CHECKS.map((description, index) => ({
      id: `check_${index}_${Date.now()}`,
      text: description,
      description,
      completed: false
    }));
  }

  /**
   * Map database row to Content interface
   */
  private static mapRowToContent(row: ContentRow): Content {
    return {
      id: row.id,
      topic: row.topic,
      category: row.category as 'Demanding' | 'Innovative',
      current_stage: row.current_stage,
      title: row.title || undefined,
      script: row.script || undefined,
      final_checks: (row.final_checks as FinalCheck[]) || [],
      publish_after: row.publish_after || undefined,
      publish_before: row.publish_before || undefined,
      link: row.link || undefined,
      morals: row.morals || [],
      flags: (row.flags as Array<'fans_feedback_analysed' | 'overall_feedback_analysed'>) || [],
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Get contents by category
   */
  static async getContentsByCategory(category: 'Demanding' | 'Innovative'): Promise<Content[]> {
    return this.getContents({ category });
  }

  /**
   * Get contents by stage
   */
  static async getContentsByStage(stage: number): Promise<Content[]> {
    return this.getContents({ stage });
  }

  /**
   * Get pending contents (stage 0)
   */
  static async getPendingContents(): Promise<Content[]> {
    return this.getContentsByStage(0);
  }

  /**
   * Get in-progress contents (stage 1-10)
   */
  static async getInProgressContents(): Promise<Content[]> {
    const allContents = await this.getContents();
    return allContents.filter(content => 
      content.current_stage > 0 && content.current_stage < CONTENT_STAGES.length - 1
    );
  }

  /**
   * Get published contents (stage 11)
   */
  static async getPublishedContents(): Promise<Content[]> {
    return this.getContentsByStage(CONTENT_STAGES.length - 1);
  }

  /**
   * Get contents ready for next stage (all requirements met)
   */
  static async getContentsReadyForNextStage(): Promise<Content[]> {
    const allContents = await this.getContents();
    const readyContents: Content[] = [];

    for (const content of allContents) {
      if (content.current_stage < CONTENT_STAGES.length - 1) {
        const validation = this.validateStageRequirements(content, content.current_stage + 1);
        if (validation.isValid) {
          // For published stage, also check dependencies
          if (content.current_stage + 1 === CONTENT_STAGES.length - 1) {
            const depValidation = await this.validatePublishDependencies(content);
            if (depValidation.isValid) {
              readyContents.push(content);
            }
          } else {
            readyContents.push(content);
          }
        }
      }
    }

    return readyContents;
  }

  /**
   * Get contents with incomplete final checks
   */
  static async getContentsWithIncompleteFinalChecks(): Promise<Content[]> {
    const allContents = await this.getContents();
    return allContents.filter(content => 
      content.final_checks.some(check => !check.completed)
    );
  }

  /**
   * Get contents with dependencies
   */
  static async getContentsWithDependencies(): Promise<Content[]> {
    const allContents = await this.getContents();
    return allContents.filter(content => 
      content.publish_after || content.publish_before
    );
  }

  /**
   * Get content statistics
   */
  static async getContentStatistics(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    published: number;
    byCategory: Record<string, number>;
    byStage: Record<string, number>;
  }> {
    const allContents = await this.getContents();
    
    const stats = {
      total: allContents.length,
      pending: 0,
      inProgress: 0,
      published: 0,
      byCategory: {} as Record<string, number>,
      byStage: {} as Record<string, number>
    };

    allContents.forEach(content => {
      // Count by status
      if (content.current_stage === 0) {
        stats.pending++;
      } else if (content.current_stage === CONTENT_STAGES.length - 1) {
        stats.published++;
      } else {
        stats.inProgress++;
      }

      // Count by category
      stats.byCategory[content.category] = (stats.byCategory[content.category] || 0) + 1;

      // Count by stage
      const stageName = CONTENT_STAGES[content.current_stage];
      stats.byStage[stageName] = (stats.byStage[stageName] || 0) + 1;
    });

    return stats;
  }

  /**
   * Advanced search with multiple criteria
   */
  static async advancedSearch(criteria: {
    topic?: string;
    category?: 'Demanding' | 'Innovative';
    stage?: number;
    hasTitle?: boolean;
    hasScript?: boolean;
    hasLink?: boolean;
    hasMorals?: boolean;
    hasIncompleteFinalChecks?: boolean;
    publishAfter?: string;
    publishBefore?: string;
  }): Promise<Content[]> {
    let contents = await this.getContents();

    // Apply filters
    if (criteria.topic) {
      contents = contents.filter(content => 
        content.topic.toLowerCase().includes(criteria.topic!.toLowerCase())
      );
    }

    if (criteria.category) {
      contents = contents.filter(content => content.category === criteria.category);
    }

    if (criteria.stage !== undefined) {
      contents = contents.filter(content => content.current_stage === criteria.stage);
    }

    if (criteria.hasTitle !== undefined) {
      contents = contents.filter(content => 
        criteria.hasTitle ? !!content.title : !content.title
      );
    }

    if (criteria.hasScript !== undefined) {
      contents = contents.filter(content => 
        criteria.hasScript ? !!content.script : !content.script
      );
    }

    if (criteria.hasLink !== undefined) {
      contents = contents.filter(content => 
        criteria.hasLink ? !!content.link : !content.link
      );
    }

    if (criteria.hasMorals !== undefined) {
      contents = contents.filter(content => 
        criteria.hasMorals ? content.morals.length > 0 : content.morals.length === 0
      );
    }

    if (criteria.hasIncompleteFinalChecks !== undefined) {
      contents = contents.filter(content => {
        const hasIncomplete = content.final_checks.some(check => !check.completed);
        return criteria.hasIncompleteFinalChecks ? hasIncomplete : !hasIncomplete;
      });
    }

    if (criteria.publishAfter) {
      contents = contents.filter(content => content.publish_after === criteria.publishAfter);
    }

    if (criteria.publishBefore) {
      contents = contents.filter(content => content.publish_before === criteria.publishBefore);
    }

    return contents;
  }

  /**
   * Update content flags
   */
  static async updateContentFlags(id: string, flags: ContentFlag[]): Promise<Content> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .update({ 
          flags,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapRowToContent(data);
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Add flag to content
   */
  static async addContentFlag(id: string, flag: ContentFlag): Promise<Content> {
    const content = await this.getContentById(id);
    if (!content) {
      throw new Error('Content not found');
    }

    const updatedFlags = content.flags.includes(flag)
      ? content.flags
      : [...content.flags, flag];

    return this.updateContentFlags(id, updatedFlags);
  }

  /**
   * Remove flag from content
   */
  static async removeContentFlag(id: string, flag: ContentFlag): Promise<Content> {
    const content = await this.getContentById(id);
    if (!content) {
      throw new Error('Content not found');
    }

    const updatedFlags = content.flags.filter(f => f !== flag);
    return this.updateContentFlags(id, updatedFlags);
  }

  /**
   * Validate URL format
   */
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}