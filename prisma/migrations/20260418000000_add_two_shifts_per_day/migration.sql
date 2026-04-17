-- Add support for 2 shifts/day per employee
ALTER TABLE "public"."shifts"
ADD COLUMN IF NOT EXISTS "shift_index" INTEGER NOT NULL DEFAULT 1;

-- Rebuild unique/index to include shift_index
DROP INDEX IF EXISTS "shifts_employee_id_work_date_idx";
DROP INDEX IF EXISTS "shifts_employee_id_work_date_key";

CREATE UNIQUE INDEX "shifts_employee_id_work_date_shift_index_key"
ON "public"."shifts" ("employee_id", "work_date", "shift_index");

CREATE INDEX "shifts_employee_id_work_date_shift_index_idx"
ON "public"."shifts" ("employee_id", "work_date", "shift_index");
