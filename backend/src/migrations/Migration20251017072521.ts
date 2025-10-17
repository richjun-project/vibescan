import { Migration } from '@mikro-orm/migrations';

export class Migration20251017072521 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "subscription" drop constraint if exists "subscription_plan_check";`);

    this.addSql(`alter table "payment" drop constraint if exists "payment_subscription_plan_check";`);

    this.addSql(`alter table "scan" drop constraint if exists "scan_grade_check";`);

    this.addSql(`alter table "subscription" add constraint "subscription_plan_check" check("plan" in ('free', 'starter', 'pro', 'business', 'enterprise'));`);

    this.addSql(`alter table "payment" add constraint "payment_subscription_plan_check" check("subscription_plan" in ('free', 'starter', 'pro', 'business', 'enterprise'));`);

    this.addSql(`alter table "scan" alter column "grade" type text using ("grade"::text);`);
    this.addSql(`alter table "scan" add constraint "scan_grade_check" check("grade" in ('A', 'B', 'C', 'D'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "subscription" drop constraint if exists "subscription_plan_check";`);

    this.addSql(`alter table "payment" drop constraint if exists "payment_subscription_plan_check";`);

    this.addSql(`alter table "scan" drop constraint if exists "scan_grade_check";`);

    this.addSql(`alter table "subscription" add constraint "subscription_plan_check" check("plan" in ('free', 'pro', 'business', 'enterprise'));`);

    this.addSql(`alter table "payment" add constraint "payment_subscription_plan_check" check("subscription_plan" in ('free', 'pro', 'business', 'enterprise'));`);

    this.addSql(`alter table "scan" alter column "grade" type smallint using ("grade"::smallint);`);
  }

}
