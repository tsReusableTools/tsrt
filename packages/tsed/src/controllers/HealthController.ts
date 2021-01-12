import { Controller, Get } from '@tsed/common';
import { Summary, Returns } from '@tsed/schema';

@Controller('/health.html')
export class HealthController {
  @Get('/')
  @Summary('Provides health check endpoint for API')
  @Returns(200).Description('API heath check success').ContentType('text/html')
  public check(): string {
    return 'I\'m ok.';
  }
}
