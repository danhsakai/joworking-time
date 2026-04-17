import { z } from "zod";

const HH_MM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const employeeCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{3,4}$/, "Ma nhan vien phai la 3 hoac 4 chu so");

export const authSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  employeeCode: employeeCodeSchema,
  password: z.string().min(6).max(128),
});

export const shiftSchema = z
  .object({
    workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    shiftIndex: z.number().int().min(1).max(2),
    timeIn: z.string().regex(HH_MM_REGEX),
    timeOut: z.string().regex(HH_MM_REGEX),
    breakIn: z.string().regex(HH_MM_REGEX),
    breakOut: z.string().regex(HH_MM_REGEX),
    evidencePath: z.string().optional(),
  })
  .superRefine((value, context) => {
    const toMinutes = (raw: string) => {
      const [hour, minute] = raw.split(":").map(Number);
      return hour * 60 + minute;
    };

    const timeInMinutes = toMinutes(value.timeIn);
    const timeOutMinutes = toMinutes(value.timeOut);
    const breakInMinutes = toMinutes(value.breakIn);
    const breakOutMinutes = toMinutes(value.breakOut);

    if (timeOutMinutes <= timeInMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timeOut"],
        message: "Time out phai lon hon time in",
      });
    }

    if (breakOutMinutes <= breakInMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["breakOut"],
        message: "Break out phai lon hon break in",
      });
    }

    if (breakInMinutes < timeInMinutes || breakOutMinutes > timeOutMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["breakIn"],
        message: "Khoang break phai nam trong khung gio lam",
      });
    }
  });

export const reportRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .superRefine((value, context) => {
    if (value.from > value.to) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["from"],
        message: "Ngay bat dau khong duoc sau ngay ket thuc",
      });
    }
  });
