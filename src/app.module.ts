import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';
import { ThrottlerModule } from '@nestjs/throttler';
import typeorm from './config/databaseConfig';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { AdminModule } from './modules/admin/admin.module';
import { ParentModule } from './modules/parent/parent.module';
import { SeederModule } from './database/seeder.module';
import { MessagesModule } from './modules/messages/messages.module';

config();

@Module({
  imports: [
    // Add ConfigModule.forRoot() to the imports array, and pass in an
    // optional configuration object if needed like envs and other configurations
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', `.env.${process.env.NODE_ENV}`],
      load: [typeorm],
    }),

    // Add ThrottlerModule.forRoot() to protect applications
    //from brute-force attacks is rate-limiting limit is 10 for in 60sec (min)
    ThrottlerModule.forRoot([
      {
        limit: 10,
        ttl: 60000,
      },
    ]),
    SharedModule,
    PublicModule,
    AuthModule,
    AdminModule,
    ParentModule,
    SeederModule,
    MessagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
