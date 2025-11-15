import { NestFactory } from '@nestjs/core';
import { HttpStatus, Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger-setup';
import { LoggerService } from './shared/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { isDev, port, globalPrefix } from './common/constants/env';
import { ensureUploadDirs, UPLOAD_ROOT } from './common/config/upload.config';

declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    snapshot: true,
  });

  app.use(json({ limit: '20mb' }));
  app.use(
    urlencoded({
      limit: '20mb',
      extended: true,
    }),
  );

  ensureUploadDirs();
  app.useStaticAssets(UPLOAD_ROOT, { prefix: '/uploads/' });

  app.enableCors({ origin: '*', credentials: true });

  app.setGlobalPrefix(globalPrefix);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: false,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );

  // logger interceptor for debugging and logging in dev mode

  app.useGlobalInterceptors(new LoggingInterceptor());

  // enableShutdownHooks for graceful shutdown on sigterm signal
  if (!isDev) {
    app.enableShutdownHooks();
  }

  // swagger setup
  if (isDev) setupSwagger(app);

  await app.listen(port, '0.0.0.0', async () => {
    app.useLogger(app.get(LoggerService));
    const url = await app.getUrl();

    const logger = new Logger('NestApplication');

    logger.log(`server is running at : ${url}/api and port ${port}`);

    if (module.hot) {
      module.hot.accept();
      module.hot.dispose(() => app.close());
    }
  });
}

bootstrap();
