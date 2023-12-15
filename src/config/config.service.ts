import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();



interface DatabaseConfig {
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

interface DatabaseItemConfig extends DatabaseConfig {
  tenants: string[];
}

interface Config {
  default: DatabaseConfig;
  databases: DatabaseItemConfig[];
}


class ConfigService {
  private readonly config: Config;
  private readonly tenantDatabaseMapping: Map<string, string>;

  constructor(private env: { [k: string]: string | undefined }) {
    const filePath = 'src/resources/config.yaml';  // TODO: Make this configurable
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      this.config = yaml.load(fileContents) as Config; // Use safeLoad to prevent possible security issues
      // TODO: add a mechanism to invalidate config after x seconds
      
    } catch (error) {  // TODO: Handle error better
      throw new Error(`Error loading YAML file: ${error}`);
    }
    this.tenantDatabaseMapping = this.getTenantDatabaseMapping();
  }

  getTenantDatabaseMapping(): Map<string, string> {
    const mapping = new Map<string, string>();
    for (const db of this.config.databases) {
      for (const tenant of db.tenants) {
        mapping.set(tenant, db.name);
        // TODO: All loaded databases logs
      }
    }

    return mapping;
  }

  getDatabaseForTenant(tenant: string): string | undefined {
    return this.tenantDatabaseMapping.get(tenant);
  }

  getDatabaseConfig(name: string): DatabaseConfig | undefined {
    const dbConfig = this.config.databases.find((db) => db.name === name);
    return dbConfig;
  }

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }
    return value;
  }

  public ensureValues(keys: string[]) {
    keys.forEach((k) => this.getValue(k, true));
    return this;
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode != 'DEV';
  }

  public getTypeOrmConfig(): TypeOrmModuleOptions {
    const tenantConfig = this.config.default;
    return {
      name: 'default',
      type: 'postgres',

      host: tenantConfig.host,
      port: tenantConfig.port,
      username: tenantConfig.username,
      password: tenantConfig.password,
      database: tenantConfig.database,

      entities: [__dirname + '/../models/**/*.entity{.ts,.js}'],
      migrationsTableName: 'migration',
      migrations: ['src/migration/*.ts'],
      ssl: false,
      synchronize: true,
      autoLoadEntities: true,
    };
  }

  public getTenantTypeOrmConfig(database: string): TypeOrmModuleOptions{
    const dbConfig = this.getDatabaseConfig(database) || this.config.default;  // TODO: add recovery when tenant is not found
    const defaultConfig = this.getTypeOrmConfig();
    const tenantSpecificConfig: TypeOrmModuleOptions = {
      name: dbConfig.name,
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: defaultConfig.entities,
      migrationsTableName: defaultConfig.migrationsTableName,
      migrations: defaultConfig.migrations,
      ssl: false,
      synchronize: true,
      autoLoadEntities: true,
    };

    return tenantSpecificConfig;
  }
}

const configService = new ConfigService(process.env);

export { configService };
