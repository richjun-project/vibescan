import { Migration } from '@mikro-orm/migrations';

export class Migration20251017073334 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "payment_log" ("id" uuid not null, "user_id" int not null, "order_id" varchar(255) null, "payment_key" varchar(255) null, "amount" numeric(10,2) null, "subscription_plan" varchar(255) null, "status" text check ("status" in ('initiated', 'toss_success', 'toss_failed', 'db_save_success', 'db_save_failed', 'subscription_update_success', 'subscription_update_failed', 'completed', 'failed')) not null, "message" text null, "request_data" jsonb null, "response_data" jsonb null, "error_data" jsonb null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "payment_log_pkey" primary key ("id"));`);

    this.addSql(`alter table "payment_log" add constraint "payment_log_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "payment_log" cascade;`);
  }

}
