import { Controller, Get, Status } from '@tsed/common';

@Controller('/health.html')
export class HealthController {
  @Get('/')
  @Status(200)
  public check(): string {
    return 'I\'m good.';
  }
}
