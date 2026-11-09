import { DocumentBuilder } from '@nestjs/swagger';

export function addSwaggerTags(config: DocumentBuilder): DocumentBuilder {
  return config
  .addTag('Example', 'Endpoints to manage examples')
  .addTag('Health', 'Endpoints to check the health of the application')
}
