import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.key');
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async savePost(postData: any) {
    const { data, error } = await this.supabase
      .from('reddit_posts')
      .insert([
        {
          post_id: postData.id,
          title: postData.title,
          author: postData.author,
          subreddit: postData.subreddit,
          score: postData.score,
          url: postData.url,
          created_utc: new Date(postData.created_utc * 1000),
          num_comments: postData.num_comments,
          selftext: postData.selftext,
          permalink: postData.permalink,
        },
      ])
      .select();

    if (error) {
      console.error('Error saving post:', error);
      throw error;
    }

    return data;
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
}
