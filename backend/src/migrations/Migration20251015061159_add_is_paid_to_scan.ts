import { Migration } from '@mikro-orm/migrations';

export class Migration20251015061159_add_is_paid_to_scan extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "scan" add column "is_paid" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "scan" drop column "is_paid";`);
  }

}
