-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "employee_code" VARCHAR(4) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "hourly_rate" INTEGER NOT NULL DEFAULT 32500,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "time_in_minutes" INTEGER NOT NULL,
    "time_out_minutes" INTEGER NOT NULL,
    "break_in_minutes" INTEGER NOT NULL,
    "break_out_minutes" INTEGER NOT NULL,
    "break_minutes" INTEGER NOT NULL,
    "work_minutes" INTEGER NOT NULL,
    "salary_amount" INTEGER NOT NULL,
    "evidence_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_summaries" (
    "id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "period_from" DATE NOT NULL,
    "period_to" DATE NOT NULL,
    "total_work_minutes" INTEGER NOT NULL,
    "total_salary" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "employee_id" UUID,
    "action_type" VARCHAR(64) NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE INDEX "shifts_employee_id_work_date_idx" ON "shifts"("employee_id", "work_date");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_employee_id_work_date_key" ON "shifts"("employee_id", "work_date");

-- CreateIndex
CREATE INDEX "payroll_summaries_employee_id_period_from_period_to_idx" ON "payroll_summaries"("employee_id", "period_from", "period_to");

-- CreateIndex
CREATE INDEX "audit_logs_employee_id_action_type_idx" ON "audit_logs"("employee_id", "action_type");

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_summaries" ADD CONSTRAINT "payroll_summaries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
