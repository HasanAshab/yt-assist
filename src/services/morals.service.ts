import { ContentService } from './content.service';
import type { Content } from '@/types';

/**
 * Interface for formatted moral entries
 */
export interface MoralEntry {
  id: string;
  text: string;
  contentTopic: string;
  formattedText: string;
  contentId: string;
}

/**
 * Service for aggregating and managing morals from all content
 */
export class MoralsService {
  /**
   * Get all morals from all content with formatted display
   */
  static async getAllMorals(): Promise<MoralEntry[]> {
    try {
      const contents = await ContentService.getContents();
      const morals: MoralEntry[] = [];

      contents.forEach(content => {
        content.morals.forEach((moral, index) => {
          if (moral.trim()) {
            morals.push({
              id: `${content.id}_${index}`,
              text: moral.trim(),
              contentTopic: content.topic,
              formattedText: `${moral.trim()} [${content.topic}]`,
              contentId: content.id
            });
          }
        });
      });

      // Sort by content topic for consistent ordering
      return morals.sort((a, b) => a.contentTopic.localeCompare(b.contentTopic));
    } catch (error) {
      console.error('Error fetching morals:', error);
      return [];
    }
  }

  /**
   * Search morals by text content
   */
  static async searchMorals(searchTerm: string): Promise<MoralEntry[]> {
    const allMorals = await this.getAllMorals();
    
    if (!searchTerm.trim()) {
      return allMorals;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return allMorals.filter(moral => 
      moral.text.toLowerCase().includes(lowerSearchTerm) ||
      moral.contentTopic.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Filter morals by content topic
   */
  static async filterMoralsByTopic(topic: string): Promise<MoralEntry[]> {
    const allMorals = await this.getAllMorals();
    return allMorals.filter(moral => 
      moral.contentTopic.toLowerCase().includes(topic.toLowerCase())
    );
  }

  /**
   * Get morals for specific content
   */
  static async getMoralsForContent(contentId: string): Promise<MoralEntry[]> {
    const allMorals = await this.getAllMorals();
    return allMorals.filter(moral => moral.contentId === contentId);
  }

  /**
   * Get unique content topics that have morals
   */
  static async getTopicsWithMorals(): Promise<string[]> {
    const allMorals = await this.getAllMorals();
    const topics = new Set(allMorals.map(moral => moral.contentTopic));
    return Array.from(topics).sort();
  }

  /**
   * Get morals count by content topic
   */
  static async getMoralsCountByTopic(): Promise<Record<string, number>> {
    const allMorals = await this.getAllMorals();
    const counts: Record<string, number> = {};

    allMorals.forEach(moral => {
      counts[moral.contentTopic] = (counts[moral.contentTopic] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get total morals count
   */
  static async getTotalMoralsCount(): Promise<number> {
    const allMorals = await this.getAllMorals();
    return allMorals.length;
  }

  /**
   * Get morals statistics
   */
  static async getMoralsStatistics(): Promise<{
    totalMorals: number;
    totalContentsWithMorals: number;
    averageMoralsPerContent: number;
    topicsWithMorals: string[];
    moralsCountByTopic: Record<string, number>;
  }> {
    const allMorals = await this.getAllMorals();
    const topicsWithMorals = await this.getTopicsWithMorals();
    const moralsCountByTopic = await this.getMoralsCountByTopic();

    return {
      totalMorals: allMorals.length,
      totalContentsWithMorals: topicsWithMorals.length,
      averageMoralsPerContent: topicsWithMorals.length > 0 
        ? Math.round((allMorals.length / topicsWithMorals.length) * 100) / 100 
        : 0,
      topicsWithMorals,
      moralsCountByTopic
    };
  }

  /**
   * Format moral text with content topic
   */
  static formatMoral(moralText: string, contentTopic: string): string {
    return `${moralText.trim()} [${contentTopic}]`;
  }

  /**
   * Parse formatted moral text to extract moral and topic
   */
  static parseMoral(formattedText: string): { moral: string; topic: string } | null {
    const match = formattedText.match(/^(.+?)\s*\[([^\]]+)\]$/);
    if (match) {
      return {
        moral: match[1].trim(),
        topic: match[2].trim()
      };
    }
    return null;
  }

  /**
   * Get morals grouped by content topic
   */
  static async getMoralsGroupedByTopic(): Promise<Record<string, MoralEntry[]>> {
    const allMorals = await this.getAllMorals();
    const grouped: Record<string, MoralEntry[]> = {};

    allMorals.forEach(moral => {
      if (!grouped[moral.contentTopic]) {
        grouped[moral.contentTopic] = [];
      }
      grouped[moral.contentTopic].push(moral);
    });

    return grouped;
  }

  /**
   * Export morals as formatted text
   */
  static async exportMoralsAsText(): Promise<string> {
    const allMorals = await this.getAllMorals();
    return allMorals.map(moral => moral.formattedText).join('\n');
  }

  /**
   * Export morals as JSON
   */
  static async exportMoralsAsJSON(): Promise<string> {
    const allMorals = await this.getAllMorals();
    return JSON.stringify(allMorals, null, 2);
  }
}