import { Controller, Get, Post, Query, Param, Body } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { DatabaseService } from '../database/database.service';

@Controller('reddit')
export class RedditController {
  constructor(
    private readonly redditService: RedditService,
    private readonly databaseService: DatabaseService,
  ) {}

  // ============================================
  // SCRAPING ENDPOINTS
  // ============================================

  @Get('scrape/:subreddit')
  async scrapeSubreddit(
    @Param('subreddit') subreddit: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 25;
    return await this.redditService.scrapeSubreddit(subreddit, limitNum);
  }

  @Post('scrape')
  async scrapeSubredditPost(
    @Body('subreddit') subreddit: string,
    @Body('limit') limit?: number,
  ) {
    return await this.redditService.scrapeSubreddit(subreddit, limit || 25);
  }

  @Get('scrape-all')
  async scrapeAllSubreddits() {
    return await this.redditService.scrapeAllSubreddits();
  }

  @Get('top/:subreddit')
  async getTopPostsByParam(
    @Param('subreddit') subreddit: string,
    @Query('timeframe') timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.redditService.getTopPosts(
      subreddit,
      timeframe || 'week',
      limitNum,
    );
  }

  @Get('top')
  async getTopPosts(
    @Query('subreddit') subreddit: string,
    @Query('timeframe') timeframe?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('limit') limit?: number,
  ) {
    return await this.redditService.getTopPosts(
      subreddit,
      timeframe || 'day',
      limit ? parseInt(limit.toString()) : 25,
    );
  }

  @Get('top-all')
  async scrapeTopPostsAll(
    @Query('timeframe') timeframe?: 'week' | 'month',
  ) {
    return await this.redditService.scrapeTopPostsAllSubreddits(
      timeframe || 'week',
    );
  }

  @Get('new/:subreddit')
  async getNewPostsByParam(
    @Param('subreddit') subreddit: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 25;
    return await this.redditService.getNewPosts(subreddit, limitNum);
  }

  @Get('new')
  async getNewPosts(
    @Query('subreddit') subreddit: string,
    @Query('limit') limit?: number,
  ) {
    return await this.redditService.getNewPosts(
      subreddit,
      limit ? parseInt(limit.toString()) : 25,
    );
  }

  @Get('search/:subreddit')
  async searchPostsByParam(
    @Param('subreddit') subreddit: string,
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 25;
    return await this.redditService.searchPosts(subreddit, query, limitNum);
  }

  @Get('search')
  async searchPosts(
    @Query('subreddit') subreddit: string,
    @Query('query') query: string,
    @Query('limit') limit?: number,
  ) {
    return await this.redditService.searchPosts(
      subreddit,
      query,
      limit ? parseInt(limit.toString()) : 25,
    );
  }

  // ============================================
  // ANALYTICS ENDPOINTS
  // ============================================

  @Get('analytics/overview')
  async getOverallAnalytics() {
    return await this.redditService.getOverallAnalytics();
  }

  @Get('analytics/:subreddit')
  async getSubredditAnalytics(@Param('subreddit') subreddit: string) {
    return await this.redditService.getSubredditAnalytics(subreddit);
  }

  @Get('trending/topics')
  async getTrendingTopics(
    @Query('subreddit') subreddit?: string,
    @Query('days') days?: string,
    @Query('min_mentions') minMentions?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const minMentionsNum = minMentions ? parseInt(minMentions, 10) : 3;
    
    return await this.databaseService.analyzeTrendingTopics(
      subreddit,
      daysNum,
      minMentionsNum,
    );
  }

  @Get('trending/posts')
  async getTopPostsWeek(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.databaseService.getTopPostsLastWeek(limitNum);
  }

  @Get('trending/fastest-growing')
  async getFastestGrowingPosts(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return await this.databaseService.getFastestGrowingPosts();
  }

  @Get('trending/high-engagement')
  async getHighEngagementPosts(
    @Query('subreddit') subreddit?: string,
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 7;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    return await this.databaseService.getHighEngagementPosts(
      subreddit,
      daysNum,
      limitNum,
    );
  }

  // ============================================
  // POST ENDPOINTS
  // ============================================

  @Get('posts')
  async getAllPosts(@Query('limit') limit?: number) {
    return await this.databaseService.getAllPosts(
      limit ? parseInt(limit.toString()) : 100,
    );
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: string) {
    return await this.databaseService.getPostById(id);
  }

  @Get('posts/:id/snapshots')
  async getPostSnapshots(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.databaseService.getPostSnapshots(id, limitNum);
  }

  @Get('posts/:id/velocity')
  async getPostVelocity(@Param('id') id: string) {
    return await this.databaseService.getPostVelocity(id);
  }

  @Get('posts/subreddit/:subreddit')
  async getPostsBySubreddit(
    @Param('subreddit') subreddit: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return await this.databaseService.getPostsBySubreddit(subreddit, limitNum);
  }

  @Get('posts/author/:author')
  async getPostsByAuthor(
    @Param('author') author: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.databaseService.getPostsByAuthor(author, limitNum);
  }

  @Post('posts/search')
  async searchPostsInDb(
    @Body() body: { query: string; subreddit?: string; limit?: number },
  ) {
    return await this.databaseService.searchPosts(
      body.query,
      body.subreddit,
      body.limit || 50,
    );
  }

  @Post('posts/date-range')
  async getPostsByDateRange(
    @Body() body: { startDate: string; endDate: string; subreddit?: string },
  ) {
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    return await this.databaseService.getPostsByDateRange(
      startDate,
      endDate,
      body.subreddit,
    );
  }

  // ============================================
  // SUBREDDIT MANAGEMENT ENDPOINTS
  // ============================================

  @Get('subreddits')
  async getActiveSubreddits() {
    return await this.databaseService.getActiveSubreddits();
  }

  @Get('subreddits/tracked')
  async getTrackedSubreddits() {
    return this.redditService.getTrackedSubreddits();
  }

  @Get('subreddits/stats')
  async getSubredditStats() {
    return await this.databaseService.getSubredditStats();
  }

  @Post('subreddits/add')
  async addSubreddit(
    @Body() body: { name: string; displayName?: string; description?: string },
  ) {
    return await this.databaseService.addSubreddit(
      body.name,
      body.displayName,
      body.description,
    );
  }

  @Post('subreddits/toggle')
  async toggleSubreddit(
    @Body() body: { name: string; isActive: boolean },
  ) {
    return await this.databaseService.toggleSubreddit(
      body.name,
      body.isActive,
    );
  }

  // ============================================
  // LOGS ENDPOINTS
  // ============================================

  @Get('logs/scraping')
  async getScrapingLogs(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.databaseService.getRecentScrapingLogs(limitNum);
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Reddit Scraper API',
    };
  }
}