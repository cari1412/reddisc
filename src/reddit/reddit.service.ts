import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import axios from 'axios';

export interface ScrapeResult {
  subreddit: string;
  totalPosts: number;
  newPosts: number;
  posts: any[];
  duration: number;
  timeframe?: string;
  error?: string;
}

@Injectable()
export class RedditService {
  private readonly baseUrl = 'https://www.reddit.com';
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; RedditScraper/1.0)',
  };
  private readonly logger = new Logger(RedditService.name);

  // List of subreddits to track (from your list)
  private readonly trackedSubreddits = [
    'B2BSaas',
    'Business_Ideas',
    'Entrepreneur',
    'indiehackers',
    'Saas',
    'SaaSMarketing',
    'SaaS',
    'Startup_Ideas',
    'microsaas',
  ];

  constructor(private databaseService: DatabaseService) {}

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================
  // SCRAPING METHODS
  // ============================================

  async scrapeSubreddit(subredditName: string, limit = 25): Promise<ScrapeResult> {
    const startTime = Date.now();
    try {
      await this.delay(1000); // Rate limiting
      
      const url = `${this.baseUrl}/r/${subredditName}/hot.json?limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const postData = this.formatPostData(post);
        
        try {
          const saved = await this.databaseService.savePost(postData);
          if (saved) {
            savedPosts.push(saved);
          }
        } catch (error) {
          this.logger.error(`Error saving post ${post.id}:`, error.message);
        }
      }

      // Update subreddit last scraped time
      await this.databaseService.updateSubredditLastScraped(subredditName);

      // Log scraping activity
      const duration = Date.now() - startTime;
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: 'hot',
        status: 'success',
        postsFound: posts.length,
        postsSaved: savedPosts.length,
        durationMs: duration,
      });

      this.logger.log(`Scraped r/${subredditName}: ${savedPosts.length}/${posts.length} new posts in ${duration}ms`);

      return {
        subreddit: subredditName,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Error scraping r/${subredditName}:`, error.message);
      
      // Log error
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: 'hot',
        status: 'error',
        postsFound: 0,
        postsSaved: 0,
        errorMessage: error.message,
        durationMs: duration,
      });
      
      throw error;
    }
  }

  async getTopPosts(
    subredditName: string,
    timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'week',
    limit = 50
  ): Promise<ScrapeResult> {
    const startTime = Date.now();
    try {
      await this.delay(1000);
      
      const url = `${this.baseUrl}/r/${subredditName}/top.json?t=${timeframe}&limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const postData = this.formatPostData(post);
        
        try {
          const saved = await this.databaseService.savePost(postData);
          if (saved) {
            savedPosts.push(saved);
          }
        } catch (error) {
          this.logger.error(`Error saving post ${post.id}:`, error.message);
        }
      }

      await this.databaseService.updateSubredditLastScraped(subredditName);

      const duration = Date.now() - startTime;
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: `top_${timeframe}`,
        status: 'success',
        postsFound: posts.length,
        postsSaved: savedPosts.length,
        durationMs: duration,
      });

      this.logger.log(`Got top posts from r/${subredditName} (${timeframe}): ${savedPosts.length}/${posts.length} new posts`);

      return {
        subreddit: subredditName,
        timeframe,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Error getting top posts from r/${subredditName}:`, error.message);
      
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: `top_${timeframe}`,
        status: 'error',
        postsFound: 0,
        postsSaved: 0,
        errorMessage: error.message,
        durationMs: duration,
      });
      
      throw error;
    }
  }

  async getNewPosts(subredditName: string, limit = 25): Promise<ScrapeResult> {
    const startTime = Date.now();
    try {
      await this.delay(1000);
      
      const url = `${this.baseUrl}/r/${subredditName}/new.json?limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const postData = this.formatPostData(post);
        
        try {
          const saved = await this.databaseService.savePost(postData);
          if (saved) {
            savedPosts.push(saved);
          }
        } catch (error) {
          this.logger.error(`Error saving post ${post.id}:`, error.message);
        }
      }

      await this.databaseService.updateSubredditLastScraped(subredditName);

      const duration = Date.now() - startTime;
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: 'new',
        status: 'success',
        postsFound: posts.length,
        postsSaved: savedPosts.length,
        durationMs: duration,
      });

      this.logger.log(`Got new posts from r/${subredditName}: ${savedPosts.length}/${posts.length} new posts`);

      return {
        subreddit: subredditName,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Error getting new posts from r/${subredditName}:`, error.message);
      
      await this.databaseService.createScrapingLog({
        subreddit: subredditName,
        scrapeType: 'new',
        status: 'error',
        postsFound: 0,
        postsSaved: 0,
        errorMessage: error.message,
        durationMs: duration,
      });
      
      throw error;
    }
  }

  async searchPosts(subredditName: string, query: string, limit = 25) {
    try {
      await this.delay(1000);
      
      const url = `${this.baseUrl}/r/${subredditName}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&limit=${limit}&sort=relevance`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const results: any[] = [];

      for (const item of posts) {
        const post = item.data;
        results.push({
          id: post.id,
          title: post.title,
          author: post.author || 'deleted',
          subreddit: post.subreddit,
          score: post.score,
          url: post.url,
          created_utc: post.created_utc,
          num_comments: post.num_comments,
          permalink: post.permalink,
        });
      }

      this.logger.log(`Search in r/${subredditName} for "${query}": ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Error searching in r/${subredditName}:`, error.message);
      throw error;
    }
  }

  // ============================================
  // AUTOMATED SCRAPING (CRON JOBS)
  // ============================================

  // Scrape all tracked subreddits every hour
  @Cron(CronExpression.EVERY_HOUR)
  async scrapeAllSubredditsHourly() {
    this.logger.log('Starting hourly scrape of all subreddits...');
    
    for (const subreddit of this.trackedSubreddits) {
      try {
        await this.scrapeSubreddit(subreddit, 25);
        await this.delay(2000); // Extra delay between subreddits
      } catch (error) {
        this.logger.error(`Failed to scrape r/${subreddit}:`, error.message);
      }
    }
    
    this.logger.log('Hourly scrape completed');
  }

  // Get top posts from last week every 6 hours
  @Cron(CronExpression.EVERY_6_HOURS)
  async scrapeTopPostsWeekly() {
    this.logger.log('Starting weekly top posts scrape...');
    
    for (const subreddit of this.trackedSubreddits) {
      try {
        await this.getTopPosts(subreddit, 'week', 50);
        await this.delay(2000);
      } catch (error) {
        this.logger.error(`Failed to get top posts from r/${subreddit}:`, error.message);
      }
    }
    
    this.logger.log('Weekly top posts scrape completed');
  }

  // Analyze trending topics every 12 hours
  @Cron(CronExpression.EVERY_12_HOURS)
  async analyzeTrendingTopics() {
    this.logger.log('Analyzing trending topics...');
    
    try {
      const topics = await this.databaseService.analyzeTrendingTopics(undefined, 7, 3);
      this.logger.log(`Found ${topics.length} trending topics`);
      
      // Optionally save to trending_topics table
      // await this.databaseService.saveTrendingTopics(topics);
    } catch (error) {
      this.logger.error('Error analyzing trending topics:', error.message);
    }
  }

  // ============================================
  // MANUAL SCRAPING METHODS
  // ============================================

  async scrapeAllSubreddits() {
    this.logger.log('Starting manual scrape of all subreddits...');
    const results: ScrapeResult[] = [];
    
    for (const subreddit of this.trackedSubreddits) {
      try {
        const result = await this.scrapeSubreddit(subreddit, 25);
        results.push(result);
        await this.delay(2000);
      } catch (error) {
        this.logger.error(`Failed to scrape r/${subreddit}:`, error.message);
        results.push({
          subreddit,
          totalPosts: 0,
          newPosts: 0,
          posts: [],
          duration: 0,
          error: error.message,
        });
      }
    }
    
    return {
      total: results.length,
      results,
    };
  }

  async scrapeTopPostsAllSubreddits(timeframe: 'week' | 'month' = 'week') {
    this.logger.log(`Starting top posts (${timeframe}) scrape...`);
    const results: ScrapeResult[] = [];
    
    for (const subreddit of this.trackedSubreddits) {
      try {
        const result = await this.getTopPosts(subreddit, timeframe, 50);
        results.push(result);
        await this.delay(2000);
      } catch (error) {
        this.logger.error(`Failed to get top posts from r/${subreddit}:`, error.message);
        results.push({
          subreddit,
          timeframe,
          totalPosts: 0,
          newPosts: 0,
          posts: [],
          duration: 0,
          error: error.message,
        });
      }
    }
    
    return {
      total: results.length,
      timeframe,
      results,
    };
  }

  // ============================================
  // ANALYTICS & REPORTING
  // ============================================

  async getSubredditAnalytics(subredditName: string) {
    try {
      const [
        topPosts,
        fastestGrowing,
        trendingTopics,
        recentActivity,
      ] = await Promise.all([
        this.databaseService.getHighEngagementPosts(subredditName, 7, 20),
        this.databaseService.getFastestGrowingPosts(),
        this.databaseService.analyzeTrendingTopics(subredditName, 7, 2),
        this.databaseService.getPostsBySubreddit(subredditName, 50),
      ]);

      return {
        subreddit: subredditName,
        topPosts,
        fastestGrowing: fastestGrowing.filter((p: any) => p.subreddit === subredditName),
        trendingTopics,
        recentActivity,
      };
    } catch (error) {
      this.logger.error(`Error getting analytics for r/${subredditName}:`, error.message);
      throw error;
    }
  }

  async getOverallAnalytics() {
    try {
      const [
        topPosts,
        fastestGrowing,
        subredditStats,
        trendingTopics,
      ] = await Promise.all([
        this.databaseService.getTopPostsLastWeek(50),
        this.databaseService.getFastestGrowingPosts(),
        this.databaseService.getSubredditStats(),
        this.databaseService.analyzeTrendingTopics(undefined, 7, 3),
      ]);

      return {
        topPosts,
        fastestGrowing,
        subredditStats,
        trendingTopics,
      };
    } catch (error) {
      this.logger.error('Error getting overall analytics:', error.message);
      throw error;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatPostData(post: any) {
    return {
      id: post.id,
      title: post.title,
      author: post.author || 'deleted',
      subreddit: post.subreddit,
      score: post.score,
      upvote_ratio: post.upvote_ratio,
      url: post.url,
      created_utc: post.created_utc,
      num_comments: post.num_comments,
      selftext: post.selftext || '',
      permalink: post.permalink,
      thumbnail: post.thumbnail,
      is_video: post.is_video || false,
      domain: post.domain,
      link_flair_text: post.link_flair_text,
    };
  }

  getTrackedSubreddits() {
    return this.trackedSubreddits;
  }
}