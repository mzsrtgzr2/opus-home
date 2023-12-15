import { Inject, Injectable, Scope } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Finding, Resource } from './models';

@Injectable({scope: Scope.REQUEST})
export class AppService {
  private readonly findingRepository: Repository<Finding>;
  private readonly resourceRepository: Repository<Resource>;

  constructor(@Inject('CONNECTION') connection) {
    this.findingRepository = connection.getRepository(Finding);
    this.resourceRepository = connection.getRepository(Resource);
  }
  
  async addFinding(newFinding: any): Promise<Finding | Error> {
    const existingFinding = await this.findingRepository.findOne({
      where: {
        externalId: newFinding.externalId,
        tenantID: newFinding.tenantID,
      },
    });

    if (existingFinding) {
      throw new Error('Finding with the same externalId already exists');
    }

    const resource = new Resource();
    resource.uniqueId = newFinding.resource.uniqueId;
    resource.Name = newFinding.resource.Name;
    resource.cloudAccount = newFinding.resource.cloudAccount;

    const createdResource = await this.resourceRepository.save(resource);

    const finding = new Finding();
    finding.externalId = newFinding.externalId;
    finding.Type = newFinding.Type;
    finding.Title = newFinding.Title;
    finding.Severity = newFinding.Severity;
    finding.createdAt = newFinding.createdAt;
    finding.Sensor = newFinding.Sensor;
    finding.resource = createdResource;
    finding.tenantID = newFinding.tenantID;

    return await this.findingRepository.save(finding);
  }

  async getAllFindingsByTenantID(
    tenantID: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    items: Finding[];
    page: number;
    totalCount: number;
    totalPages: number;
  }> {
    const [items, totalCount] = await this.findingRepository.findAndCount({
      where: { tenantID },
      take: limit,
      skip: (page - 1) * limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return { items, page, totalCount, totalPages };
  }
}