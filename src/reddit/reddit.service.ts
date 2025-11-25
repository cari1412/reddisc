import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Snoowrap from 'snoowrap';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RedditService implements OnModuleInit {
  private reddit: Snoowrap;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {}

  onModuleInit() {
    const userAgent = this.configService.get<string>('reddit.userAgent');
    const clientId = this.configService.get<string>('reddit.clientId');
    const clientSecret = this.configService.get<string>('reddit.clientSecret');
    const username = this.configService.get<string>('reddit.username');
    const password = this.configService.get<string>('reddit.password');

    if (!userAgent || !clientId || !clientSecret || !username || !password) {
      throw new Error('Reddit credentials are not properly configured');
    }

    this.reddit = new Snoowrap({
      userAgent,
      clientId,
      clientSecret,
      username,
      password,
    });
  }

  async scrapeSubreddit(subredditName: string, limit = 25) {
    try {
      const subreddit = this.reddit.getSubreddit(subredditName);
      const posts = await subreddit.getHot({ limit } as any);

      const savedPosts: any[] = [];

      for (const post of posts) {
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author?.name || 'deleted',
            subreddit: post.subreddit?.display_name || subredditName,
            score: post.score,
            url: post.url,
            created_utc: post.created_utc,
            num_comments: post.num_comments,
            selftext: post.selftext || '',
            permalink: post.permalink,
          };

          const saved = await this.databaseService.savePost(postData);
          savedPosts.push(saved);
        }
      }

      return {
        subreddit: subredditName,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
      };
    } catch (error) {
      console.error('Error scraping subreddit:', error);
      throw error;
    }
  }

  async getTopPosts(subredditName: string, timeframe: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all' = 'day', limit = 25) {
    try {
      const subreddit = this.reddit.getSubreddit(subredditName);
      const posts = await subreddit.getTop({ time: timeframe, limit } as any);

      const savedPosts: any[] = [];

      for (const post of posts) {
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author?.name || 'deleted',
            subreddit: post.subreddit?.display_name || subredditName,
            score: post.score,
            url: post.url,
            created_utc: post.created_utc,
            num_comments: post.num_comments,
            selftext: post.selftext || '',
            permalink: post.permalink,
          };

          const saved = await this.databaseService.savePost(postData);
          savedPosts.push(saved);
        }
      }

      return {
        subreddit: subredditName,
        timeframe,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
      };
    } catch (error) {
      console.error('Error getting top posts:', error);
      throw error;
    }
  }

  async searchPosts(subredditName: string, query: string, limit = 25) {
    try {
      const subreddit = this.reddit.getSubreddit(subredditName);
      const searchResults = await subreddit.search({
        query,
        sort: 'relevance',
        limit,
      } as any);

      const results: any[] = [];

      for (let i = 0; i < Math.min(searchResults.length, limit); i++) {
        const post = searchResults[i];
        results.push({
          id: post.id,
          title: post.title,
          author: post.author?.name || 'deleted',
          score: post.score,
          url: post.url,
          created_utc: post.created_utc,
          num_comments: post.num_comments,
          permalink: post.permalink,
        });
      }

      return results;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  async getNewPosts(subredditName: string, limit = 25) {
    try {
      const subreddit = this.reddit.getSubreddit(subredditName);
      const posts = await subreddit.getNew({ limit } as any);

      const savedPosts: any[] = [];

      for (const post of posts) {
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author?.name || 'deleted',
            subreddit: post.subreddit?.display_name || subredditName,
            score: post.score,
            url: post.url,
            created_utc: post.created_utc,
            num_comments: post.num_comments,
            selftext: post.selftext || '',
            permalink: post.permalink,
          };

          const saved = await this.databaseService.savePost(postData);
          savedPosts.push(saved);
        }
      }

      return {
        subreddit: subredditName,
        totalPosts: posts.length,
        newPosts: savedPosts.length,
        posts: savedPosts,
      };
    } catch (error) {
      console.error('Error getting new posts:', error);
      throw error;
    }
  }
}