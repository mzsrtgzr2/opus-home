import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Resource } from './resource.entity'; // Import the Resource entity

export enum Severity {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

@Entity()
export class Finding {
  @PrimaryColumn()
  externalId: string;

  @Column()
  Type: string;

  @Column()
  Title: string;

  @Column({
    type: 'enum',
    enum: Severity,
    default: Severity.LOW,
  })
  Severity: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column()
  Sensor: string;

  @OneToOne(() => Resource)
  @JoinColumn()
  resource: Resource;

  @Column()
  tenantID: string;
}
