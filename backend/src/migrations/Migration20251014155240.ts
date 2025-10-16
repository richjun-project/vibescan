import { Migration } from '@mikro-orm/migrations';

export class Migration20251014155240 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "ranking" drop constraint "ranking_latest_scan_id_fkey";`);

    this.addSql(`alter table "subscription" drop constraint "subscription_user_id_fkey";`);

    this.addSql(`alter table "scan" drop constraint "scan_user_id_fkey";`);

    this.addSql(`alter table "vulnerability" drop constraint "vulnerability_scan_id_fkey";`);

    this.addSql(`drop index "idx_ranking_score";`);
    this.addSql(`alter table "ranking" drop constraint "ranking_domain_key";`);
    this.addSql(`alter table "ranking" drop column "grade", drop column "scan_count", drop column "latest_scan_id", drop column "created_at";`);

    this.addSql(`alter table "ranking" add column "rank" int not null, add column "period" text check ("period" in ('weekly', 'monthly', 'quarterly', 'all_time')) not null, add column "industry" varchar(255) null, add column "is_public" boolean not null default false, add column "period_start" timestamptz not null, add column "period_end" timestamptz not null;`);
    this.addSql(`alter table "ranking" alter column "domain" type varchar(255) using ("domain"::varchar(255));`);
    this.addSql(`alter table "ranking" alter column "updated_at" drop default;`);
    this.addSql(`alter table "ranking" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "ranking" alter column "updated_at" set not null;`);

    this.addSql(`alter table "user" alter column "provider" type varchar(255) using ("provider"::varchar(255));`);
    this.addSql(`alter table "user" alter column "picture" type varchar(255) using ("picture"::varchar(255));`);
    this.addSql(`alter table "user" alter column "role" type text using ("role"::text);`);
    this.addSql(`alter table "user" alter column "role" set not null;`);
    this.addSql(`alter table "user" alter column "subscription_plan" type text using ("subscription_plan"::text);`);
    this.addSql(`alter table "user" alter column "subscription_plan" set not null;`);
    this.addSql(`alter table "user" alter column "scans_this_month" type int using ("scans_this_month"::int);`);
    this.addSql(`alter table "user" alter column "scans_this_month" set not null;`);
    this.addSql(`alter table "user" alter column "free_scans_used" type int using ("free_scans_used"::int);`);
    this.addSql(`alter table "user" alter column "free_scans_used" set not null;`);
    this.addSql(`alter table "user" alter column "paid_scans_remaining" type int using ("paid_scans_remaining"::int);`);
    this.addSql(`alter table "user" alter column "paid_scans_remaining" set not null;`);
    this.addSql(`alter table "user" alter column "created_at" drop default;`);
    this.addSql(`alter table "user" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "user" alter column "created_at" set not null;`);
    this.addSql(`alter table "user" alter column "updated_at" drop default;`);
    this.addSql(`alter table "user" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "user" alter column "updated_at" set not null;`);
    this.addSql(`alter table "user" add constraint "user_role_check" check("role" in ('user', 'admin'));`);
    this.addSql(`alter table "user" add constraint "user_subscription_plan_check" check("subscription_plan" in ('free', 'starter', 'pro', 'enterprise'));`);
    this.addSql(`alter table "user" drop constraint "user_email_key";`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`drop index "idx_subscription_user_id";`);
    this.addSql(`alter table "subscription" drop constraint "subscription_stripe_subscription_id_key";`);

    this.addSql(`alter table "subscription" add column "stripe_price_id" varchar(255) null;`);
    this.addSql(`alter table "subscription" alter column "plan" type varchar(255) using ("plan"::varchar(255));`);
    this.addSql(`alter table "subscription" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "subscription" alter column "status" set default 'trialing';`);
    this.addSql(`alter table "subscription" alter column "status" set not null;`);
    this.addSql(`alter table "subscription" alter column "created_at" drop default;`);
    this.addSql(`alter table "subscription" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "subscription" alter column "created_at" set not null;`);
    this.addSql(`alter table "subscription" alter column "updated_at" drop default;`);
    this.addSql(`alter table "subscription" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "subscription" alter column "updated_at" set not null;`);
    this.addSql(`alter table "subscription" add constraint "subscription_status_check" check("status" in ('active', 'canceled', 'past_due', 'trialing'));`);
    this.addSql(`alter table "subscription" add constraint "subscription_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`drop index "idx_scan_share_token";`);
    this.addSql(`drop index "idx_scan_user_id";`);

    this.addSql(`alter table "scan" add column "json_report" jsonb null;`);
    this.addSql(`alter table "scan" alter column "domain" type varchar(255) using ("domain"::varchar(255));`);
    this.addSql(`alter table "scan" alter column "repository_url" type varchar(255) using ("repository_url"::varchar(255));`);
    this.addSql(`alter table "scan" alter column "status" type text using ("status"::text);`);
    this.addSql(`alter table "scan" alter column "status" set not null;`);
    this.addSql(`alter table "scan" alter column "grade" type text using ("grade"::text);`);
    this.addSql(`alter table "scan" alter column "is_public" type boolean using ("is_public"::boolean);`);
    this.addSql(`alter table "scan" alter column "is_public" set not null;`);
    this.addSql(`alter table "scan" alter column "share_token" type varchar(255) using ("share_token"::varchar(255));`);
    this.addSql(`alter table "scan" alter column "created_at" drop default;`);
    this.addSql(`alter table "scan" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "scan" alter column "created_at" set not null;`);
    this.addSql(`alter table "scan" alter column "updated_at" drop default;`);
    this.addSql(`alter table "scan" alter column "updated_at" type timestamptz using ("updated_at"::timestamptz);`);
    this.addSql(`alter table "scan" alter column "updated_at" set not null;`);
    this.addSql(`alter table "scan" add constraint "scan_status_check" check("status" in ('pending', 'running', 'completed', 'failed'));`);
    this.addSql(`alter table "scan" add constraint "scan_grade_check" check("grade" in ('A', 'B', 'C', 'D'));`);
    this.addSql(`alter table "scan" add constraint "scan_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);

    this.addSql(`drop index "idx_vulnerability_scan_id";`);

    this.addSql(`alter table "vulnerability" add column "cwe_id" varchar(255) null;`);
    this.addSql(`alter table "vulnerability" alter column "title" type varchar(255) using ("title"::varchar(255));`);
    this.addSql(`alter table "vulnerability" alter column "description" type text using ("description"::text);`);
    this.addSql(`alter table "vulnerability" alter column "description" set not null;`);
    this.addSql(`alter table "vulnerability" alter column "severity" type text using ("severity"::text);`);
    this.addSql(`alter table "vulnerability" alter column "severity" set not null;`);
    this.addSql(`alter table "vulnerability" alter column "category" type text using ("category"::text);`);
    this.addSql(`alter table "vulnerability" alter column "category" set not null;`);
    this.addSql(`alter table "vulnerability" alter column "cve_id" type varchar(255) using ("cve_id"::varchar(255));`);
    this.addSql(`alter table "vulnerability" alter column "created_at" drop default;`);
    this.addSql(`alter table "vulnerability" alter column "created_at" type timestamptz using ("created_at"::timestamptz);`);
    this.addSql(`alter table "vulnerability" alter column "created_at" set not null;`);
    this.addSql(`alter table "vulnerability" add constraint "vulnerability_severity_check" check("severity" in ('critical', 'high', 'medium', 'low', 'info'));`);
    this.addSql(`alter table "vulnerability" add constraint "vulnerability_category_check" check("category" in ('owasp_top10', 'dependency', 'secret', 'ssl_tls', 'security_headers', 'infrastructure', 'code_quality'));`);
    this.addSql(`alter table "vulnerability" add constraint "vulnerability_scan_id_foreign" foreign key ("scan_id") references "scan" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "scan" drop constraint if exists "scan_status_check";`);
    this.addSql(`alter table "scan" drop constraint if exists "scan_grade_check";`);

    this.addSql(`alter table "scan" drop constraint "scan_user_id_foreign";`);

    this.addSql(`alter table "subscription" drop constraint if exists "subscription_status_check";`);

    this.addSql(`alter table "subscription" drop constraint "subscription_user_id_foreign";`);

    this.addSql(`alter table "user" drop constraint if exists "user_role_check";`);
    this.addSql(`alter table "user" drop constraint if exists "user_subscription_plan_check";`);

    this.addSql(`alter table "vulnerability" drop constraint if exists "vulnerability_severity_check";`);
    this.addSql(`alter table "vulnerability" drop constraint if exists "vulnerability_category_check";`);

    this.addSql(`alter table "vulnerability" drop constraint "vulnerability_scan_id_foreign";`);

    this.addSql(`alter table "ranking" drop column "rank", drop column "period", drop column "industry", drop column "is_public", drop column "period_start", drop column "period_end";`);

    this.addSql(`alter table "ranking" add column "grade" varchar(2) null, add column "scan_count" int4 null default 1, add column "latest_scan_id" int4 null, add column "created_at" timestamp(6) null default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "ranking" alter column "domain" type varchar(500) using ("domain"::varchar(500));`);
    this.addSql(`alter table "ranking" alter column "updated_at" type timestamp(6) using ("updated_at"::timestamp(6));`);
    this.addSql(`alter table "ranking" alter column "updated_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "ranking" alter column "updated_at" drop not null;`);
    this.addSql(`alter table "ranking" add constraint "ranking_latest_scan_id_fkey" foreign key ("latest_scan_id") references "scan" ("id") on update no action on delete no action;`);
    this.addSql(`create index "idx_ranking_score" on "ranking" ("score");`);
    this.addSql(`alter table "ranking" add constraint "ranking_domain_key" unique ("domain");`);

    this.addSql(`alter table "scan" drop column "json_report";`);

    this.addSql(`alter table "scan" alter column "domain" type varchar(500) using ("domain"::varchar(500));`);
    this.addSql(`alter table "scan" alter column "repository_url" type varchar(500) using ("repository_url"::varchar(500));`);
    this.addSql(`alter table "scan" alter column "status" type varchar(20) using ("status"::varchar(20));`);
    this.addSql(`alter table "scan" alter column "status" drop not null;`);
    this.addSql(`alter table "scan" alter column "grade" type varchar(2) using ("grade"::varchar(2));`);
    this.addSql(`alter table "scan" alter column "is_public" type bool using ("is_public"::bool);`);
    this.addSql(`alter table "scan" alter column "is_public" drop not null;`);
    this.addSql(`alter table "scan" alter column "share_token" type varchar(100) using ("share_token"::varchar(100));`);
    this.addSql(`alter table "scan" alter column "created_at" type timestamp(6) using ("created_at"::timestamp(6));`);
    this.addSql(`alter table "scan" alter column "created_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "scan" alter column "created_at" drop not null;`);
    this.addSql(`alter table "scan" alter column "updated_at" type timestamp(6) using ("updated_at"::timestamp(6));`);
    this.addSql(`alter table "scan" alter column "updated_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "scan" alter column "updated_at" drop not null;`);
    this.addSql(`create index "idx_scan_share_token" on "scan" ("share_token");`);
    this.addSql(`create index "idx_scan_user_id" on "scan" ("user_id");`);

    this.addSql(`alter table "subscription" drop column "stripe_price_id";`);

    this.addSql(`alter table "subscription" alter column "status" drop default;`);
    this.addSql(`alter table "subscription" alter column "status" type varchar(50) using ("status"::varchar(50));`);
    this.addSql(`alter table "subscription" alter column "status" drop not null;`);
    this.addSql(`alter table "subscription" alter column "plan" type varchar(50) using ("plan"::varchar(50));`);
    this.addSql(`alter table "subscription" alter column "created_at" type timestamp(6) using ("created_at"::timestamp(6));`);
    this.addSql(`alter table "subscription" alter column "created_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "subscription" alter column "created_at" drop not null;`);
    this.addSql(`alter table "subscription" alter column "updated_at" type timestamp(6) using ("updated_at"::timestamp(6));`);
    this.addSql(`alter table "subscription" alter column "updated_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "subscription" alter column "updated_at" drop not null;`);
    this.addSql(`create index "idx_subscription_user_id" on "subscription" ("user_id");`);
    this.addSql(`alter table "subscription" add constraint "subscription_stripe_subscription_id_key" unique ("stripe_subscription_id");`);

    this.addSql(`alter table "user" alter column "provider" type varchar(50) using ("provider"::varchar(50));`);
    this.addSql(`alter table "user" alter column "picture" type varchar(500) using ("picture"::varchar(500));`);
    this.addSql(`alter table "user" alter column "role" type varchar(20) using ("role"::varchar(20));`);
    this.addSql(`alter table "user" alter column "role" drop not null;`);
    this.addSql(`alter table "user" alter column "subscription_plan" type varchar(50) using ("subscription_plan"::varchar(50));`);
    this.addSql(`alter table "user" alter column "subscription_plan" drop not null;`);
    this.addSql(`alter table "user" alter column "scans_this_month" type int4 using ("scans_this_month"::int4);`);
    this.addSql(`alter table "user" alter column "scans_this_month" drop not null;`);
    this.addSql(`alter table "user" alter column "free_scans_used" type int4 using ("free_scans_used"::int4);`);
    this.addSql(`alter table "user" alter column "free_scans_used" drop not null;`);
    this.addSql(`alter table "user" alter column "paid_scans_remaining" type int4 using ("paid_scans_remaining"::int4);`);
    this.addSql(`alter table "user" alter column "paid_scans_remaining" drop not null;`);
    this.addSql(`alter table "user" alter column "created_at" type timestamp(6) using ("created_at"::timestamp(6));`);
    this.addSql(`alter table "user" alter column "created_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "user" alter column "created_at" drop not null;`);
    this.addSql(`alter table "user" alter column "updated_at" type timestamp(6) using ("updated_at"::timestamp(6));`);
    this.addSql(`alter table "user" alter column "updated_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "user" alter column "updated_at" drop not null;`);
    this.addSql(`alter table "user" drop constraint "user_email_unique";`);
    this.addSql(`alter table "user" add constraint "user_email_key" unique ("email");`);

    this.addSql(`alter table "vulnerability" drop column "cwe_id";`);

    this.addSql(`alter table "vulnerability" alter column "title" type varchar(500) using ("title"::varchar(500));`);
    this.addSql(`alter table "vulnerability" alter column "description" type text using ("description"::text);`);
    this.addSql(`alter table "vulnerability" alter column "description" drop not null;`);
    this.addSql(`alter table "vulnerability" alter column "severity" type varchar(20) using ("severity"::varchar(20));`);
    this.addSql(`alter table "vulnerability" alter column "severity" drop not null;`);
    this.addSql(`alter table "vulnerability" alter column "category" type varchar(100) using ("category"::varchar(100));`);
    this.addSql(`alter table "vulnerability" alter column "category" drop not null;`);
    this.addSql(`alter table "vulnerability" alter column "cve_id" type varchar(50) using ("cve_id"::varchar(50));`);
    this.addSql(`alter table "vulnerability" alter column "created_at" type timestamp(6) using ("created_at"::timestamp(6));`);
    this.addSql(`alter table "vulnerability" alter column "created_at" set default CURRENT_TIMESTAMP;`);
    this.addSql(`alter table "vulnerability" alter column "created_at" drop not null;`);
    this.addSql(`create index "idx_vulnerability_scan_id" on "vulnerability" ("scan_id");`);
  }

}
