import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.key');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not properly configured');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized successfully');
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // ============================================
  // POST OPERATIONS
  // ============================================

  async savePost(postData: any) {
    try {
      // Check if post already exists
      const existing = await this.getPostById(postData.id);
      
      if (existing) {
        // Update existing post and create snapshot
        return await this.updatePost(postData);
      }

      // Insert new post
      const { data, error } = await this.supabase
        .from('reddit_posts')
        .insert([
          {
            post_id: postData.id,
            title: postData.title,
            author: postData.author,
            subreddit: postData.subreddit,
            score: postData.score,
            upvote_ratio: postData.upvote_ratio,
            url: postData.url,
            created_utc: new Date(postData.created_utc * 1000),
            num_comments: postData.num_comments,
            selftext: postData.selftext,
            permalink: postData.permalink,
            thumbnail: postData.thumbnail,
            is_video: postData.is_video || false,
            domain: postData.domain,
            link_flair_text: postData.link_flair_text,
          },
        ])
        .select();

      if (error) {
        this.logger.error('Error saving post:', error);
        throw error;
      }

      this.logger.log(`New post saved: ${postData.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error in savePost:', error);
      throw error;
    }
  }

  async updatePost(postData: any) {
    try {
      const { data, error } = await this.supabase
        .from('reddit_posts')
        .update({
          score: postData.score,
          num_comments: postData.num_comments,
          upvote_ratio: postData.upvote_ratio,
          selftext: postData.selftext,
          last_updated_at: new Date(),
        })
        .eq('post_id', postData.id)
        .select();

      if (error) {
        this.logger.error('Error updating post:', error);
        throw error;
      }

      this.logger.log(`Post updated: ${postData.id}`);
      return data;
    } catch (error) {
      this.logger.error('Error in updatePost:', error);
      throw error;
    }
  }

  async getPostById(postId: string) {
    const { data, error } = await this.supabase
      .from('reddit_posts')
      .select('*')
      .eq('post_id', postId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  async getAllPosts(limit = 100) {
    const { data, error } = await this.supabase
      .from('reddit_posts')
      .select('*')
      .order('created_utc', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  }

  async getPostsBySubreddit(subreddit: string, limit = 100) {
    const { data, error } = await this.supabase
      .from('reddit_posts')
      .select('*')
      .eq('subreddit', subreddit)
      .order('created_utc', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  }

  // ============================================
  // TRENDING & ANALYTICS
  // ============================================

  async getTopPostsLastWeek(limit = 50) {
    const { data, error } = await this.supabase
      .from('top_posts_week')
      .select('*')
      .limit(limit);

    if (error) {
      this.logger.error('Error getting top posts:', error);
      throw error;
    }

    return data;
  }

  async getFastestGrowingPosts(limit = 20) {
    const { data, error } = await this.supabase
      .from('fastest_growing_posts')
      .select('*')
      .limit(limit);

    if (error) {
      this.logger.error('Error getting fastest growing posts:', error);
      throw error;
    }

    return data;
  }

  async getSubredditStats() {
    const { data, error } = await this.supabase
      .from('subreddit_stats')
      .select('*');

    if (error) {
      this.logger.error('Error getting subreddit stats:', error);
      throw error;
    }

    return data;
  }

  async analyzeTrendingTopics(
    subreddit?: string,
    daysBack = 7,
    minMentions = 3
  ) {
    try {
      const { data, error } = await this.supabase.rpc(
        'analyze_trending_topics',
        {
          target_subreddit: subreddit || null,
          days_back: daysBack,
          min_mentions: minMentions,
        }
      );

      if (error) {
        this.logger.error('Error analyzing trending topics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in analyzeTrendingTopics:', error);
      throw error;
    }
  }

  async getPostVelocity(postId: string) {
    try {
      const { data, error } = await this.supabase.rpc('get_post_velocity', {
        target_post_id: postId,
      });

      if (error) {
        this.logger.error('Error getting post velocity:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in getPostVelocity:', error);
      throw error;
    }
  }

  async getHighEngagementPosts(
    subreddit?: string,
    daysBack = 7,
    limit = 50
  ) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysBack);

      let query = this.supabase
        .from('reddit_posts')
        .select('*')
        .gte('created_utc', sevenDaysAgo.toISOString())
        .order('engagement_score', { ascending: false })
        .limit(limit);

      if (subreddit) {
        query = query.eq('subreddit', subreddit);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error getting high engagement posts:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in getHighEngagementPosts:', error);
      throw error;
    }
  }

  // ============================================
  // SUBREDDIT MANAGEMENT
  // ============================================

  async getActiveSubreddits() {
    const { data, error } = await this.supabase
      .from('subreddits')
      .select('*')
      .eq('is_active', true);

    if (error) {
      this.logger.error('Error getting active subreddits:', error);
      throw error;
    }

    return data;
  }

  async updateSubredditLastScraped(subredditName: string) {
    const { data, error } = await this.supabase
      .from('subreddits')
      .update({ last_scraped_at: new Date() })
      .eq('name', subredditName)
      .select();

    if (error) {
      this.logger.error('Error updating subreddit last scraped:', error);
      throw error;
    }

    return data;
  }

  async addSubreddit(name: string, displayName?: string, description?: string) {
    const { data, error } = await this.supabase
      .from('subreddits')
      .insert([
        {
          name,
          display_name: displayName || name,
          description: description || null,
          is_active: true,
        },
      ])
      .select();

    if (error) {
      this.logger.error('Error adding subreddit:', error);
      throw error;
    }

    return data;
  }

  async toggleSubreddit(name: string, isActive: boolean) {
    const { data, error } = await this.supabase
      .from('subreddits')
      .update({ is_active: isActive })
      .eq('name', name)
      .select();

    if (error) {
      this.logger.error('Error toggling subreddit:', error);
      throw error;
    }

    return data;
  }

  // ============================================
  // SCRAPING LOGS
  // ============================================

  async createScrapingLog(logData: {
    subreddit: string;
    scrapeType: string;
    status: string;
    postsFound: number;
    postsSaved: number;
    errorMessage?: string;
    durationMs?: number;
  }) {
    const { data, error } = await this.supabase
      .from('scraping_logs')
      .insert([
        {
          subreddit: logData.subreddit,
          scrape_type: logData.scrapeType,
          status: logData.status,
          posts_found: logData.postsFound,
          posts_saved: logData.postsSaved,
          error_message: logData.errorMessage || null,
          duration_ms: logData.durationMs || null,
          completed_at: new Date(),
        },
      ])
      .select();

    if (error) {
      this.logger.error('Error creating scraping log:', error);
      throw error;
    }

    return data;
  }

  async getRecentScrapingLogs(limit = 50) {
    const { data, error } = await this.supabase
      .from('scraping_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Error getting scraping logs:', error);
      throw error;
    }

    return data;
  }

  // ============================================
  // POST SNAPSHOTS
  // ============================================

  async getPostSnapshots(postId: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('post_snapshots')
      .select('*')
      .eq('post_id', postId)
      .order('snapshot_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Error getting post snapshots:', error);
      throw error;
    }

    return data;
  }

  // ============================================
  // SEARCH & FILTERS
  // ============================================

  async searchPosts(query: string, subreddit?: string, limit = 50) {
    try {
      let queryBuilder = this.supabase
        .from('reddit_posts')
        .select('*')
        .or(`title.ilike.%${query}%,selftext.ilike.%${query}%`)
        .order('created_utc', { ascending: false })
        .limit(limit);

      if (subreddit) {
        queryBuilder = queryBuilder.eq('subreddit', subreddit);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        this.logger.error('Error searching posts:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in searchPosts:', error);
      throw error;
    }
  }

  async getPostsByAuthor(author: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('reddit_posts')
      .select('*')
      .eq('author', author)
      .order('created_utc', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Error getting posts by author:', error);
      throw error;
    }

    return data;
  }

  async getPostsByDateRange(startDate: Date, endDate: Date, subreddit?: string) {
    try {
      let query = this.supabase
        .from('reddit_posts')
        .select('*')
        .gte('created_utc', startDate.toISOString())
        .lte('created_utc', endDate.toISOString())
        .order('created_utc', { ascending: false });

      if (subreddit) {
        query = query.eq('subreddit', subreddit);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error getting posts by date range:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in getPostsByDateRange:', error);
      throw error;
    }
  }

  // ============================================
  // TRENDING TOPICS STORAGE
  // ============================================

  async saveTrendingTopics(topics: any[]) {
    try {
      const { data, error } = await this.supabase
        .from('trending_topics')
        .insert(topics)
        .select();

      if (error) {
        this.logger.error('Error saving trending topics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in saveTrendingTopics:', error);
      throw error;
    }
  }

  async getTrendingTopics(subreddit?: string, timePeriod = 'week', limit = 50) {
    try {
      let query = this.supabase
        .from('trending_topics')
        .select('*')
        .eq('time_period', timePeriod)
        .order('avg_engagement', { ascending: false })
        .limit(limit);

      if (subreddit) {
        query = query.eq('subreddit', subreddit);
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error getting trending topics:', error);
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Error in getTrendingTopics:', error);
      throw error;
    }
  }
}