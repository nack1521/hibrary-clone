import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove properties that are not in the DTO
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
    disableErrorMessages: false, // Show detailed error messages
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
