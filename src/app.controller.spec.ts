import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Finding, Resource } from './models';

describe('AppController', () => {
  let appController: AppController;

  const mockFindingRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockResourceRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: getRepositoryToken(Finding),
          useValue: mockFindingRepository,
        },
        {
          provide: getRepositoryToken(Resource),
          useValue: mockResourceRepository,
        },
      ],
    }).compile();

    appController = moduleRef.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addFinding', () => {
    it('should add a new finding', async () => {
      const newFinding = {
        externalId: 'orca-32455',
        Type: 'public-s3-bucket',
        Title: 'S3 bucket is publicly accessible',
        Severity: 'High',
        createdAt: new Date('2023-02-07T17:04:14+0000'),
        Sensor: 'Orca',
        resource: {
          uniqueId: 'arn:aws:s3:::my-bucket-1',
          Name: 'my-bucket-1',
          cloudAccount: '475894653712',
        },
        tenantID: 'tenant123',
      };

      mockFindingRepository.findOne.mockResolvedValue(null);
      mockFindingRepository.save.mockResolvedValue(newFinding as Finding);
      mockResourceRepository.save.mockResolvedValue(newFinding.resource as Resource);

      const result = await appController.addFinding('tenant123', newFinding);

      expect(mockFindingRepository.findOne).toHaveBeenCalledWith({
        where: { externalId: newFinding.externalId, tenantID: newFinding.tenantID },
      });
      expect(mockFindingRepository.save).toHaveBeenCalledWith(expect.any(Finding));
      expect(mockResourceRepository.save).toHaveBeenCalledWith(expect.any(Resource));
      expect(result).toEqual({ success: true, data: newFinding });
    });

    it('should return BadRequestException if finding with same externalId exists', async () => {
      const existingFinding = {
        externalId: 'orca-32455',
        tenantID: 'tenant123',
      };

      mockFindingRepository.findOne.mockResolvedValue(existingFinding as Finding);

      await expect(
        appController.addFinding('tenant123', {
          externalId: 'orca-32455',
          Type: 'public-s3-bucket',
          Title: 'S3 bucket is publicly accessible',
          Severity: 'High',
          createdAt: new Date('2023-02-07T17:04:14+0000'),
          Sensor: 'Orca',
          resource: {
            uniqueId: 'arn:aws:s3:::my-bucket-1',
            Name: 'my-bucket-1',
            cloudAccount: '475894653712',
          },
          tenantID: 'tenant123',
        }),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  describe('getAllFindingsByTenantID', () => {
    it('should return all findings for a given tenantID', async () => {
      const tenantID = 'tenant123';
      const findings = [
        {
          externalId: 'orca-32455',
          Type: 'public-s3-bucket',
          Title: 'S3 bucket is publicly accessible',
          Severity: 'High',
          createdAt: new Date('2023-02-07T17:04:14+0000'),
          Sensor: 'Orca',
          resource: {
            uniqueId: 'arn:aws:s3:::my-bucket-1',
            Name: 'my-bucket-1',
            cloudAccount: '475894653712',
          },
          tenantID,
        },
        {
          externalId: 'orca-48455',
          Type: 'not-encrypted-s3-bucket',
          Title: 'S3 bucket is not encrypted',
          Severity: 'Low',
          createdAt: new Date('2023-02-07T17:04:14+0000'),
          Sensor: 'Orca',
          resource: {
            uniqueId: 'arn:aws:s3:::my-bucket-1',
            Name: 'my-bucket-1',
            cloudAccount: '475894653712',
          },
          tenantID,
        },
        {
          externalId: '2f2221d6-ce40-4ef7-9593-dd9c5bf895cf',
          Type: 'public-ssh-port',
          Title: 'EC2 has public ssh port exposed to 0.0.0.0',
          Severity: 'High',
          createdAt: new Date('2023-04-07T21:04:14+0000'),
          Sensor: 'Wiz',
          resource: {
            uniqueId: 'arn:aws:ec2:us-east-1:712894475712:instance/i-012abcd34efghi56',
            Name: 'i-012abcd34efghi56',
            cloudAccount: '712894475712',
          },
          tenantID,
        },
      ];

      mockFindingRepository.find.mockResolvedValue(findings as Finding[]);

      const result = await appController.getAllFindingsByTenantID(tenantID);

      expect(mockFindingRepository.find).toHaveBeenCalledWith({
        where: { tenantID },
      });
      expect(result).toEqual({ success: true, data: findings });
    });

    it('should throw NotFoundException if no findings are found for a given tenantID', async () => {
      const tenantID = 'tenant123';
      mockFindingRepository.find.mockResolvedValue([] as Finding[]);

      await expect(appController.getAllFindingsByTenantID(tenantID)).rejects.toThrowError(NotFoundException);
    });
  });
});
