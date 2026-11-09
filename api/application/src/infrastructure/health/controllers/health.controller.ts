import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthCheckService, HealthCheck, MongooseHealthIndicator } from '@nestjs/terminus';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongooseIndicator: MongooseHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check the application status' })
  @HealthCheck()
  healthCheck() {
    return this.health.check([() => this.mongooseIndicator.pingCheck('mongodb')]);
  }
}
