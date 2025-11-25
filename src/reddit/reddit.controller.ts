import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { DatabaseService } from '../database/database.service';

@Controller('reddit')
export class RedditController {
  constructor(
    private readonly redditService: RedditService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('scrape')
  async scrapeSubreddit(
    @Body('subreddit') subreddit: string,
    @Body('limit') limit?: number,
  ) {
    return await this.redditService.scrapeSubreddit(subreddit, limit || 25);
  }

  @Get('top')
  async getTopPosts(
    @Query('subreddit') subreddit: string,
    @Query('timeframe') timeframe?: string,
    @Query('limit') limit?: number,
  ) {
    return await this.redditService.getTopPosts(
      subreddit,
      timeframe || 'day',
      limit ? parseInt(limit.toString()) : 25,
    );
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

  @Get('posts')
  async getAllPosts(@Query('limit') limit?: number) {
    return await this.databaseService.getAllPosts(
      limit ? parseInt(limit.toString()) : 100,
    );
  }
}