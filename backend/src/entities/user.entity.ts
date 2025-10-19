import { Entity, PrimaryKey, Property, OneToMany, OneToOne, Collection, Enum } from '@mikro-orm/core';
import { Scan } from './scan.entity';
import { Subscription } from './subscription.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  email!: string;

  @Property({ nullable: true })
  password?: string;

  @Property()
  name!: string;

  @Property({ nullable: true })
  provider?: string; // 'local', 'google'

  @Property({ nullable: true })
  providerId?: string; // OAuth provider ID

  @Property({ nullable: true, columnType: 'text' })
  picture?: string; // Profile picture URL (TEXT type to support long Google URLs)

  @Enum(() => UserRole)
  role: UserRole = UserRole.USER;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  @OneToMany(() => Scan, scan => scan.user)
  scans = new Collection<Scan>(this);

  @OneToOne(() => Subscription, subscription => subscription.user, { nullable: true })
  subscription?: Subscription;
}
