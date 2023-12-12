import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Finding, Resource } from './models';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Finding)
    private readonly findingRepository: Repository<Finding>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
  ) {}

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

  async getAllFindingsByTenantID(tenantID: string): Promise<Finding[]> {
    return await this.findingRepository.find({ where: { tenantID } });
  }
}