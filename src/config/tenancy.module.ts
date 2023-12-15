import { Global, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Connection, ConnectionOptions, createConnection, getConnection } from 'typeorm';
import { configService } from './config.service';

const connectionFactory = {
  provide: 'CONNECTION',
  scope: Scope.REQUEST,
  useFactory: async (req) => {
    const tenant = req.params.tenantID || 'default'; // TODO: Handle missing tenant id better
    
    const connectionName = configService.getDatabaseForTenant(tenant);
    // Check if the connection exists, if not, create a new one
    try {
        return getConnection(connectionName);
      } catch (error) {
        const tenantConfig = configService.getTenantTypeOrmConfig(connectionName) as ConnectionOptions;
        const connection: Connection = await createConnection(tenantConfig);
        return connection;
      }
    
  },
  inject: [REQUEST],
};

@Global()
@Module({
  providers: [connectionFactory],
  exports: ['CONNECTION'],
})
export class TenancyModule {}
