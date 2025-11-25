import { Module } from '@nestjs/common';
import { RedditService } from './reddit.service';
import { RedditController } from './reddit.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RedditController],
  providers: [RedditService],
})
export class RedditModule {}
