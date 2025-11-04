import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = new Logger('Seeder');

  try {
    const seeder = app.get(SeederService);
    const result = await seeder.seed();
    
    logger.log('✅ Database seeding completed!');
    logger.log(`📊 Summary:`);
    logger.log(`   - Users: ${result.users}`);
    logger.log(`   - Children: ${result.children}`);
    logger.log(`   - Services: ${result.services}`);
    logger.log(`   - Appointments: ${result.appointments}`);
    
    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    await app.close();
    process.exit(1);
  }
}

bootstrap();

