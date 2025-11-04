import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { config } from 'dotenv';
import { ThrottlerModule } from '@nestjs/throttler';
import typeorm from './config/databaseConfig';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ChildrenModule } from './modules/children/children.module';
import { ServicesModule } from './modules/services/services.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MessagesModule } from './modules/messages/messages.module';
import { EventsModule } from './modules/events/events.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SeederModule } from './database/seeder.module';

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
    AuthModule,
    UserModule,
    ChildrenModule,
    ServicesModule,
    AppointmentsModule,
    ReportsModule,
    MessagesModule,
    EventsModule,
    AuditLogsModule,
    SeederModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
