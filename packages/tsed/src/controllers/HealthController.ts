import { Controller, Get } from '@tsed/common';
import { Summary } from '@tsed/schema';

@Controller('/health.html')
export class HealthController {
  @Get('/')
  @Summary('Checks server health')
  public check(): string {
    return 'I\'m ok.';
  }
}
