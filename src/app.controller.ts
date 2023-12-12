import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post(':tenantID/add')
  async addFinding(
    @Param('tenantID') tenantID: string,
    @Body() newFinding: any,
  ) {
    newFinding.tenantID = tenantID;

    try {
      const result = await this.appService.addFinding(newFinding);
      return { success: true, data: result };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get(':tenantID')
  async getAllFindingsByTenantID(@Param('tenantID') tenantID: string) {
    const findings = await this.appService.getAllFindingsByTenantID(tenantID);
    if (!findings || findings.length === 0) {
      throw new NotFoundException(
        'No findings found for the provided tenantID',
      );
    }
    return { success: true, data: findings };
  }
}
