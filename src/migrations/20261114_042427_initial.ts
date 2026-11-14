import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_articles_cover_items_style" AS ENUM('plain', 'dark', 'accent');
  CREATE TYPE "public"."enum_articles_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_articles_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TYPE "public"."enum_paths_level" AS ENUM('beginner', 'intermediate', 'advanced');
  CREATE TABLE "articles_cover_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"style" "enum_articles_cover_items_style" DEFAULT 'plain'
  );
  
  CREATE TABLE "articles_cover" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "articles_blocks_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_code" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_callout" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar DEFAULT 'Key takeaway',
  	"text" varchar NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_table_headers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "articles_blocks_table_rows_cells" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "articles_blocks_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "articles_blocks_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_figure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_blocks_line_diagram_markers" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"position" numeric NOT NULL,
  	"highlight" boolean
  );
  
  CREATE TABLE "articles_blocks_line_diagram_points" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"position" numeric NOT NULL,
  	"highlight" boolean
  );
  
  CREATE TABLE "articles_blocks_line_diagram_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"position" numeric NOT NULL
  );
  
  CREATE TABLE "articles_blocks_line_diagram" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"start_label" varchar,
  	"end_label" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "articles_quiz_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"correct" boolean
  );
  
  CREATE TABLE "articles_quiz" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"explanation" varchar
  );
  
  CREATE TABLE "articles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"short_title" varchar,
  	"status" "enum_articles_status" DEFAULT 'draft' NOT NULL,
  	"featured" boolean,
  	"published_at" timestamp(3) with time zone,
  	"author_id" integer,
  	"topic_id" integer,
  	"level" "enum_articles_level" DEFAULT 'beginner',
  	"read_minutes" numeric,
  	"dek" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "paths" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"level" "enum_paths_level" DEFAULT 'beginner' NOT NULL,
  	"order" numeric DEFAULT 0,
  	"card_text" varchar,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "paths_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"order" numeric DEFAULT 0,
  	"in_filter" boolean DEFAULT false,
  	"in_grid" boolean DEFAULT true,
  	"popular" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "learners_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "learners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "progress" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"learner_id" integer NOT NULL,
  	"article_id" integer NOT NULL,
  	"read" boolean DEFAULT false,
  	"saved" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"articles_id" integer,
  	"paths_id" integer,
  	"topics_id" integer,
  	"media_id" integer,
  	"users_id" integer,
  	"learners_id" integer,
  	"progress_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"learners_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "articles_cover_items" ADD CONSTRAINT "articles_cover_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_cover"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_cover" ADD CONSTRAINT "articles_cover_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_heading" ADD CONSTRAINT "articles_blocks_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_text" ADD CONSTRAINT "articles_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_code" ADD CONSTRAINT "articles_blocks_code_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_callout" ADD CONSTRAINT "articles_blocks_callout_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_table_headers" ADD CONSTRAINT "articles_blocks_table_headers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_table_rows_cells" ADD CONSTRAINT "articles_blocks_table_rows_cells_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_table_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_table_rows" ADD CONSTRAINT "articles_blocks_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_table" ADD CONSTRAINT "articles_blocks_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_figure" ADD CONSTRAINT "articles_blocks_figure_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles_blocks_figure" ADD CONSTRAINT "articles_blocks_figure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_line_diagram_markers" ADD CONSTRAINT "articles_blocks_line_diagram_markers_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_line_diagram"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_line_diagram_points" ADD CONSTRAINT "articles_blocks_line_diagram_points_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_line_diagram"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_line_diagram_notes" ADD CONSTRAINT "articles_blocks_line_diagram_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_blocks_line_diagram"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_blocks_line_diagram" ADD CONSTRAINT "articles_blocks_line_diagram_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_quiz_options" ADD CONSTRAINT "articles_quiz_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles_quiz"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles_quiz" ADD CONSTRAINT "articles_quiz_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "articles" ADD CONSTRAINT "articles_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "paths_rels" ADD CONSTRAINT "paths_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."paths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "paths_rels" ADD CONSTRAINT "paths_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "learners_sessions" ADD CONSTRAINT "learners_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "progress" ADD CONSTRAINT "progress_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "progress" ADD CONSTRAINT "progress_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_articles_fk" FOREIGN KEY ("articles_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_paths_fk" FOREIGN KEY ("paths_id") REFERENCES "public"."paths"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_learners_fk" FOREIGN KEY ("learners_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_progress_fk" FOREIGN KEY ("progress_id") REFERENCES "public"."progress"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_learners_fk" FOREIGN KEY ("learners_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "articles_cover_items_order_idx" ON "articles_cover_items" USING btree ("_order");
  CREATE INDEX "articles_cover_items_parent_id_idx" ON "articles_cover_items" USING btree ("_parent_id");
  CREATE INDEX "articles_cover_order_idx" ON "articles_cover" USING btree ("_order");
  CREATE INDEX "articles_cover_parent_id_idx" ON "articles_cover" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_heading_order_idx" ON "articles_blocks_heading" USING btree ("_order");
  CREATE INDEX "articles_blocks_heading_parent_id_idx" ON "articles_blocks_heading" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_heading_path_idx" ON "articles_blocks_heading" USING btree ("_path");
  CREATE INDEX "articles_blocks_text_order_idx" ON "articles_blocks_text" USING btree ("_order");
  CREATE INDEX "articles_blocks_text_parent_id_idx" ON "articles_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_text_path_idx" ON "articles_blocks_text" USING btree ("_path");
  CREATE INDEX "articles_blocks_code_order_idx" ON "articles_blocks_code" USING btree ("_order");
  CREATE INDEX "articles_blocks_code_parent_id_idx" ON "articles_blocks_code" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_code_path_idx" ON "articles_blocks_code" USING btree ("_path");
  CREATE INDEX "articles_blocks_callout_order_idx" ON "articles_blocks_callout" USING btree ("_order");
  CREATE INDEX "articles_blocks_callout_parent_id_idx" ON "articles_blocks_callout" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_callout_path_idx" ON "articles_blocks_callout" USING btree ("_path");
  CREATE INDEX "articles_blocks_table_headers_order_idx" ON "articles_blocks_table_headers" USING btree ("_order");
  CREATE INDEX "articles_blocks_table_headers_parent_id_idx" ON "articles_blocks_table_headers" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_table_rows_cells_order_idx" ON "articles_blocks_table_rows_cells" USING btree ("_order");
  CREATE INDEX "articles_blocks_table_rows_cells_parent_id_idx" ON "articles_blocks_table_rows_cells" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_table_rows_order_idx" ON "articles_blocks_table_rows" USING btree ("_order");
  CREATE INDEX "articles_blocks_table_rows_parent_id_idx" ON "articles_blocks_table_rows" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_table_order_idx" ON "articles_blocks_table" USING btree ("_order");
  CREATE INDEX "articles_blocks_table_parent_id_idx" ON "articles_blocks_table" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_table_path_idx" ON "articles_blocks_table" USING btree ("_path");
  CREATE INDEX "articles_blocks_figure_order_idx" ON "articles_blocks_figure" USING btree ("_order");
  CREATE INDEX "articles_blocks_figure_parent_id_idx" ON "articles_blocks_figure" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_figure_path_idx" ON "articles_blocks_figure" USING btree ("_path");
  CREATE INDEX "articles_blocks_figure_image_idx" ON "articles_blocks_figure" USING btree ("image_id");
  CREATE INDEX "articles_blocks_line_diagram_markers_order_idx" ON "articles_blocks_line_diagram_markers" USING btree ("_order");
  CREATE INDEX "articles_blocks_line_diagram_markers_parent_id_idx" ON "articles_blocks_line_diagram_markers" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_line_diagram_points_order_idx" ON "articles_blocks_line_diagram_points" USING btree ("_order");
  CREATE INDEX "articles_blocks_line_diagram_points_parent_id_idx" ON "articles_blocks_line_diagram_points" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_line_diagram_notes_order_idx" ON "articles_blocks_line_diagram_notes" USING btree ("_order");
  CREATE INDEX "articles_blocks_line_diagram_notes_parent_id_idx" ON "articles_blocks_line_diagram_notes" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_line_diagram_order_idx" ON "articles_blocks_line_diagram" USING btree ("_order");
  CREATE INDEX "articles_blocks_line_diagram_parent_id_idx" ON "articles_blocks_line_diagram" USING btree ("_parent_id");
  CREATE INDEX "articles_blocks_line_diagram_path_idx" ON "articles_blocks_line_diagram" USING btree ("_path");
  CREATE INDEX "articles_quiz_options_order_idx" ON "articles_quiz_options" USING btree ("_order");
  CREATE INDEX "articles_quiz_options_parent_id_idx" ON "articles_quiz_options" USING btree ("_parent_id");
  CREATE INDEX "articles_quiz_order_idx" ON "articles_quiz" USING btree ("_order");
  CREATE INDEX "articles_quiz_parent_id_idx" ON "articles_quiz" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" USING btree ("slug");
  CREATE INDEX "articles_author_idx" ON "articles" USING btree ("author_id");
  CREATE INDEX "articles_topic_idx" ON "articles" USING btree ("topic_id");
  CREATE INDEX "articles_updated_at_idx" ON "articles" USING btree ("updated_at");
  CREATE INDEX "articles_created_at_idx" ON "articles" USING btree ("created_at");
  CREATE UNIQUE INDEX "paths_slug_idx" ON "paths" USING btree ("slug");
  CREATE INDEX "paths_updated_at_idx" ON "paths" USING btree ("updated_at");
  CREATE INDEX "paths_created_at_idx" ON "paths" USING btree ("created_at");
  CREATE INDEX "paths_rels_order_idx" ON "paths_rels" USING btree ("order");
  CREATE INDEX "paths_rels_parent_idx" ON "paths_rels" USING btree ("parent_id");
  CREATE INDEX "paths_rels_path_idx" ON "paths_rels" USING btree ("path");
  CREATE INDEX "paths_rels_articles_id_idx" ON "paths_rels" USING btree ("articles_id");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "learners_sessions_order_idx" ON "learners_sessions" USING btree ("_order");
  CREATE INDEX "learners_sessions_parent_id_idx" ON "learners_sessions" USING btree ("_parent_id");
  CREATE INDEX "learners_updated_at_idx" ON "learners" USING btree ("updated_at");
  CREATE INDEX "learners_created_at_idx" ON "learners" USING btree ("created_at");
  CREATE UNIQUE INDEX "learners_email_idx" ON "learners" USING btree ("email");
  CREATE INDEX "progress_learner_idx" ON "progress" USING btree ("learner_id");
  CREATE INDEX "progress_article_idx" ON "progress" USING btree ("article_id");
  CREATE INDEX "progress_updated_at_idx" ON "progress" USING btree ("updated_at");
  CREATE INDEX "progress_created_at_idx" ON "progress" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_articles_id_idx" ON "payload_locked_documents_rels" USING btree ("articles_id");
  CREATE INDEX "payload_locked_documents_rels_paths_id_idx" ON "payload_locked_documents_rels" USING btree ("paths_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_learners_id_idx" ON "payload_locked_documents_rels" USING btree ("learners_id");
  CREATE INDEX "payload_locked_documents_rels_progress_id_idx" ON "payload_locked_documents_rels" USING btree ("progress_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_learners_id_idx" ON "payload_preferences_rels" USING btree ("learners_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "articles_cover_items" CASCADE;
  DROP TABLE "articles_cover" CASCADE;
  DROP TABLE "articles_blocks_heading" CASCADE;
  DROP TABLE "articles_blocks_text" CASCADE;
  DROP TABLE "articles_blocks_code" CASCADE;
  DROP TABLE "articles_blocks_callout" CASCADE;
  DROP TABLE "articles_blocks_table_headers" CASCADE;
  DROP TABLE "articles_blocks_table_rows_cells" CASCADE;
  DROP TABLE "articles_blocks_table_rows" CASCADE;
  DROP TABLE "articles_blocks_table" CASCADE;
  DROP TABLE "articles_blocks_figure" CASCADE;
  DROP TABLE "articles_blocks_line_diagram_markers" CASCADE;
  DROP TABLE "articles_blocks_line_diagram_points" CASCADE;
  DROP TABLE "articles_blocks_line_diagram_notes" CASCADE;
  DROP TABLE "articles_blocks_line_diagram" CASCADE;
  DROP TABLE "articles_quiz_options" CASCADE;
  DROP TABLE "articles_quiz" CASCADE;
  DROP TABLE "articles" CASCADE;
  DROP TABLE "paths" CASCADE;
  DROP TABLE "paths_rels" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "learners_sessions" CASCADE;
  DROP TABLE "learners" CASCADE;
  DROP TABLE "progress" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_articles_cover_items_style";
  DROP TYPE "public"."enum_articles_status";
  DROP TYPE "public"."enum_articles_level";
  DROP TYPE "public"."enum_paths_level";`)
}
