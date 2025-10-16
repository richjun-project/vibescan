import { Migration } from '@mikro-orm/migrations';

export class Migration20251015145319 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "payment" add column "subscription_plan" text check ("subscription_plan" in ('free', 'pro', 'business', 'enterprise')) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "payment" drop column "subscription_plan";`);
  }

}
