import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  Query,
  Req,
} from '@nestjs/common';
import { AppService } from './app.service';
import { Connection } from 'typeorm';

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
  async getAllFindingsByTenantID(
    @Param('tenantID') tenantID: string,
    @Query('page') page: number = 1, // Default to page 1 if not provided
    @Query('limit') limit: number = 10, // Default limit to 10 if not provided
  ) {
    const findings = await this.appService.getAllFindingsByTenantID(
      tenantID,
      page,
      limit,
    );
    if (!findings || findings.items.length === 0) {
      throw new NotFoundException(
        'No findings found for the provided tenantID',
      );
    }
    return {
      success: true,
      data: findings.items,
      page: findings.page,
      totalCount: findings.totalCount,
      totalPages: findings.totalPages,
    };
  }
}
