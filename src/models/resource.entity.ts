import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class Resource {
  @PrimaryColumn()
  uniqueId: string;

  @Column()
  Name: string;

  @Column()
  cloudAccount: string;
}
