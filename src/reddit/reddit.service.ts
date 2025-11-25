import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import axios from 'axios';

@Injectable()
export class RedditService {
  private readonly baseUrl = 'https://www.reddit.com';
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; RedditScraper/1.0)',
  };

  constructor(private databaseService: DatabaseService) {}

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async scrapeSubreddit(subredditName: string, limit = 25) {
    try {
      await this.delay(1000); // Rate limiting
      
      const url = `${this.baseUrl}/r/${subredditName}/hot.json?limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author || 'deleted',
            subreddit: post.subreddit,
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
      await this.delay(1000);
      
      const url = `${this.baseUrl}/r/${subredditName}/top.json?t=${timeframe}&limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author || 'deleted',
            subreddit: post.subreddit,
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
      await this.delay(1000);
      
      const url = `${this.baseUrl}/r/${subredditName}/new.json?limit=${limit}`;
      const response = await axios.get(url, { headers: this.headers });
      
      const posts = response.data.data.children;
      const savedPosts: any[] = [];

      for (const item of posts) {
        const post = item.data;
        const existingPost = await this.databaseService.getPostById(post.id);

        if (!existingPost) {
          const postData = {
            id: post.id,
            title: post.title,
            author: post.author || 'deleted',
            subreddit: post.subreddit,
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