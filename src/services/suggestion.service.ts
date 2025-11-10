import { ContentService } from './content.service';
import { CONTENT_STAGES, TASK_CONFIG } from '@/constants';
import type { Content, ContentSuggestion } from '@/types';

/**
 * Service for calculating publication suggestions based on content readiness
 */
export class SuggestionService {
  /**
   * Get top publication suggestions (max 2 contents closest to Published stage)
   * Requirements: 5.1, 5.2, 5.3
   */
  static async getPublicationSuggestions(): Promise<ContentSuggestion[]> {
    try {
      // Get all non-published contents
      const allContents = await ContentService.getContents();
      const nonPublishedContents = allContents.filter(
        content => content.current_stage < CONTENT_STAGES.length - 1
      );

      // Calculate suggestions for each content
      const suggestions: ContentSuggestion[] = [];
      
      for (const content of nonPublishedContents) {
        const suggestion = await this.calculateContentSuggestion(content);
        
        // Only include contents that are not blocked by dependencies
        if (suggestion.blockedBy.length === 0) {
          suggestions.push(suggestion);
        }
      }

      // Sort by score (higher is better) and take top 2
      return suggestions
        .sort((a, b) => b.score - a.score)
        .slice(0, TASK_CONFIG.MAX_SUGGESTIONS);
    } catch (error) {
      console.error('Error getting publication suggestions:', error);
      return [];
    }
  }

  /**
   * Calculate suggestion score and metadata for a single content
   */
  private static async calculateContentSuggestion(content: Content): Promise<ContentSuggestion> {
    const blockedBy = await this.checkDependencyBlocks(content);
    const score = this.calculateReadinessScore(content);
    const remainingSteps = this.calculateRemainingSteps(content);

    return {
      id: `suggestion_${content.id}`,
      type: 'stage',
      title: `Continue with ${content.topic}`,
      description: `Content is at stage ${content.current_stage} with ${remainingSteps} steps remaining`,
      priority: score > 80 ? 'high' : score > 50 ? 'medium' : 'low',
      contentId: content.id,
      content,
      score,
      remainingSteps,
      blockedBy
    };
  }

  /**
   * Calculate readiness score based on current stage and completeness
   * Higher score = closer to being publishable
   */
  private static calculateReadinessScore(content: Content): number {
    const maxStage = CONTENT_STAGES.length - 1; // Published stage index
    let score = 0;

    // Base score from current stage (0-100)
    score += (content.current_stage / maxStage) * 100;

    // Bonus points for having required fields completed
    if (content.title) score += 5;
    if (content.script) score += 10;
    if (content.link) score += 15;

    // Bonus for completed final checks
    const totalFinalChecks = content.final_checks.length;
    const completedFinalChecks = content.final_checks.filter(check => check.completed).length;
    if (totalFinalChecks > 0) {
      score += (completedFinalChecks / totalFinalChecks) * 20;
    }

    // Penalty for missing required fields at current stage
    if (content.current_stage >= 1 && !content.title) score -= 10;
    if (content.current_stage >= 5 && !content.script) score -= 15;
    if (content.current_stage >= 11 && !content.link) score -= 20;

    // Ensure score is between 0 and 150 (max possible with bonuses)
    return Math.max(0, Math.min(150, score));
  }

  /**
   * Calculate remaining steps to reach Published stage
   */
  private static calculateRemainingSteps(content: Content): number {
    const publishedStage = CONTENT_STAGES.length - 1;
    let remainingSteps = publishedStage - content.current_stage;

    // Add steps for missing required fields
    if (content.current_stage < 1 && !content.title) remainingSteps += 0.5;
    if (content.current_stage < 5 && !content.script) remainingSteps += 0.5;
    if (!content.link) remainingSteps += 0.5;

    // Add steps for incomplete final checks
    const incompleteFinalChecks = content.final_checks.filter(check => !check.completed).length;
    remainingSteps += incompleteFinalChecks * 0.1;

    return Math.round(remainingSteps * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Check if content is blocked by publish_after dependencies
   * Requirements: 5.2 - only include content with no publish_after dependencies OR whose dependencies are Published
   */
  private static async checkDependencyBlocks(content: Content): Promise<string[]> {
    const blockedBy: string[] = [];

    if (content.publish_after) {
      try {
        const dependency = await ContentService.getContentByTopic(content.publish_after);
        
        if (!dependency) {
          blockedBy.push(`Missing dependency: ${content.publish_after}`);
        } else if (dependency.current_stage < CONTENT_STAGES.length - 1) {
          blockedBy.push(`Waiting for "${content.publish_after}" to be published`);
        }
      } catch (error) {
        blockedBy.push(`Error checking dependency: ${content.publish_after}`);
      }
    }

    return blockedBy;
  }

  /**
   * Get suggestion for a specific content by topic
   */
  static async getContentSuggestion(topic: string): Promise<ContentSuggestion | null> {
    try {
      const content = await ContentService.getContentByTopic(topic);
      if (!content) return null;

      return this.calculateContentSuggestion(content);
    } catch (error) {
      console.error(`Error getting suggestion for content ${topic}:`, error);
      return null;
    }
  }

  /**
   * Check if content is ready for next stage
   */
  static async isContentReadyForNextStage(content: Content): Promise<boolean> {
    // Cannot advance if already published
    if (content.current_stage >= CONTENT_STAGES.length - 1) {
      return false;
    }

    // Check stage requirements
    const stageValidation = ContentService.validateStageRequirements(
      content, 
      content.current_stage + 1
    );
    
    if (!stageValidation.isValid) {
      return false;
    }

    // For Published stage, check dependencies
    if (content.current_stage + 1 === CONTENT_STAGES.length - 1) {
      const dependencyValidation = await ContentService.validatePublishDependencies(content);
      return dependencyValidation.isValid;
    }

    return true;
  }

  /**
   * Get all contents ready for next stage (not just top suggestions)
   */
  static async getAllReadyContents(): Promise<ContentSuggestion[]> {
    try {
      const allContents = await ContentService.getContents();
      const readyContents: ContentSuggestion[] = [];

      for (const content of allContents) {
        if (content.current_stage < CONTENT_STAGES.length - 1) {
          const isReady = await this.isContentReadyForNextStage(content);
          if (isReady) {
            const suggestion = await this.calculateContentSuggestion(content);
            readyContents.push(suggestion);
          }
        }
      }

      return readyContents.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting all ready contents:', error);
      return [];
    }
  }

  /**
   * Get contents blocked by dependencies
   */
  static async getBlockedContents(): Promise<ContentSuggestion[]> {
    try {
      const allContents = await ContentService.getContents();
      const blockedContents: ContentSuggestion[] = [];

      for (const content of allContents) {
        if (content.current_stage < CONTENT_STAGES.length - 1) {
          const suggestion = await this.calculateContentSuggestion(content);
          if (suggestion.blockedBy.length > 0) {
            blockedContents.push(suggestion);
          }
        }
      }

      return blockedContents.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error getting blocked contents:', error);
      return [];
    }
  }

  /**
   * Refresh suggestions (useful after content updates)
   * Requirements: 5.3 - implement suggestion refresh on content updates
   */
  static async refreshSuggestions(): Promise<ContentSuggestion[]> {
    // Simply recalculate suggestions - the service is stateless
    return this.getPublicationSuggestions();
  }

  /**
   * Get suggestion statistics
   */
  static async getSuggestionStatistics(): Promise<{
    totalEligible: number;
    readyToAdvance: number;
    blockedByDependencies: number;
    averageReadinessScore: number;
    topSuggestions: number;
  }> {
    try {
      const allContents = await ContentService.getContents();
      const nonPublishedContents = allContents.filter(
        content => content.current_stage < CONTENT_STAGES.length - 1
      );

      let readyCount = 0;
      let blockedCount = 0;
      let totalScore = 0;

      for (const content of nonPublishedContents) {
        const suggestion = await this.calculateContentSuggestion(content);
        totalScore += suggestion.score;

        if (suggestion.blockedBy.length === 0) {
          readyCount++;
        } else {
          blockedCount++;
        }
      }

      const topSuggestions = await this.getPublicationSuggestions();

      return {
        totalEligible: nonPublishedContents.length,
        readyToAdvance: readyCount,
        blockedByDependencies: blockedCount,
        averageReadinessScore: nonPublishedContents.length > 0 
          ? Math.round((totalScore / nonPublishedContents.length) * 10) / 10 
          : 0,
        topSuggestions: topSuggestions.length
      };
    } catch (error) {
      console.error('Error getting suggestion statistics:', error);
      return {
        totalEligible: 0,
        readyToAdvance: 0,
        blockedByDependencies: 0,
        averageReadinessScore: 0,
        topSuggestions: 0
      };
    }
  }
}