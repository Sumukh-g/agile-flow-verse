import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../common/redis/redis.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TestController } from './test.controller';
import { TestService } from './test.service';

@Module({
  imports: [AuthModule, PrismaModule, RedisModule],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}




