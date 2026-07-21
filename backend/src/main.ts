import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  // TODO: Migrate CORS origin to use ConfigService in Phase 2
  app.enableCors({
    origin: 'http://localhost:3001',
  });

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}
bootstrap().catch((error: unknown) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
