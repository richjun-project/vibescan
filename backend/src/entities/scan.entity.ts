import { Entity, PrimaryKey, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { User } from './user.entity';
import { Vulnerability } from './vulnerability.entity';

export enum ScanStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ScanGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

@Entity()
export class Scan {
  @PrimaryKey()
  id!: number;

  @Property()
  domain!: string;

  @Property({ nullable: true })
  repositoryUrl?: string;

  @ManyToOne(() => User)
  user!: User;

  @Enum(() => ScanStatus)
  status: ScanStatus = ScanStatus.PENDING;

  @Property({ default: 0 })
  progress: number = 0; // 0-100

  @Property({ nullable: true })
  progressMessage?: string;

  @Property({ nullable: true })
  score?: number; // 0-100

  @Enum({ items: () => ScanGrade, type: 'string', nullable: true })
  grade?: ScanGrade;

  @Property({ type: 'json', nullable: true })
  results?: any;

  @Property({ type: 'json', nullable: true })
  jsonReport?: any; // Full Nuclei JSON report in original format

  @Property()
  isPublic: boolean = false;

  @Property({ nullable: true })
  shareToken?: string;

  @Property()
  isPaid: boolean = false; // Free scans show preview only, paid scans show full details

  @Property({ default: false })
  isRankingShared: boolean = false; // Whether user consents to share scan in public ranking

  @Property({ default: 'ko' })
  language: 'ko' | 'en' = 'ko'; // Language for AI analysis

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @Property({ nullable: true })
  completedAt?: Date;

  @OneToMany(() => Vulnerability, vulnerability => vulnerability.scan)
  vulnerabilities = new Collection<Vulnerability>(this);
}
