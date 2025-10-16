import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';

export enum RankingPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ALL_TIME = 'all_time',
}

@Entity()
export class Ranking {
  @PrimaryKey()
  id!: number;

  @Property()
  domain!: string;

  @Property()
  score!: number;

  @Property()
  rank!: number;

  @Enum(() => RankingPeriod)
  period!: RankingPeriod;

  @Property({ nullable: true })
  industry?: string;

  @Property()
  isPublic: boolean = false;

  @Property()
  updatedAt: Date = new Date();

  @Property()
  periodStart: Date = new Date();

  @Property()
  periodEnd: Date = new Date();
}
