import { Migration } from '@mikro-orm/migrations';

export class Migration20251107044634 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "scan" add column "is_ranking_shared" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "scan" drop column "is_ranking_shared";`);
  }

}
