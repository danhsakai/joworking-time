## JoWorking Time

Ung dung theo doi gio cong part-time, tinh luong theo gio va thong ke dashboard.

Stack hien tai:

- Next.js 16 (App Router)
- Prisma + PostgreSQL (du lieu nghiep vu)
- Supabase Storage (upload anh bang chung)
- Cookie session JWT (xac thuc)

## 1) Cai dat

## Getting Started

1. Tao file `.env` tu `.env.example` va dien gia tri thuc:

```bash
cp .env.example .env
```

2. Cai dependencies:

```bash
npm install
```

3. Khoi tao database schema voi Prisma:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. Chay app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 2) Bucket Supabase can tao

- Ten bucket: `timesheet-evidence`
- Ten bucket: `employee-avatars`
- Public bucket (de hien thi link public) hoac private bucket + signed URL (co the nang cap sau)

## 3) Prisma models

- `employees`: thong tin nhan vien, ma nhan vien, password hash, hourly rate
- `shifts`: du lieu cham cong theo ngay
- `payroll_summaries`: luu snapshot tong hop luong theo khoang ngay (du phong mo rong)
- `audit_logs`: log hanh dong quan trong

Schema nam tai: `prisma/schema.prisma`

## 4) API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/shifts`
- `POST /api/shifts`
- `DELETE /api/shifts?id=<shift-id>`
- `GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `POST /api/evidence/upload`
- `POST /api/account/avatar`

## 4.1) Auth pages

- `/auth`: man hinh dang nhap/dang ky rieng
- `/`: dashboard chi hien thi khi da dang nhap

## 6) Quy tac cham cong

- 1 ngay toi da 2 ca (`shiftIndex`: 1 hoac 2)
- Moi ca chi co 1 lan nghi (`breakIn` va `breakOut`)
- Dashboard co quick filter: Hom nay / Tuan nay / Thang nay
- Dashboard so sanh voi ky truoc (% gio cong, % luong)

## 5) Ghi chu bao mat

- Password duoc hash bang `bcryptjs` truoc khi luu DB.
- Session duoc ky JWT va luu qua httpOnly cookie.
- Upload su dung `SUPABASE_SERVICE_ROLE_KEY` o server route, khong expose cho client.
