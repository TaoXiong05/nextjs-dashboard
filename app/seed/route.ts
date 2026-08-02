import bcrypt from 'bcrypt';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : 'require',
});

async function seedUsers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT
    );
  `;

  // 兼容老表：如果 users 表是之前建的（password 是 NOT NULL），
  // 这里把约束放开，并补上 Auth.js adapter 需要的两个字段
  await sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT`;
  // 角色字段：用于客户页面的权限管理（admin 可增删改/导入，user 仅可查看/导出）
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user'`;

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
    }),
  );

  return insertedUsers;
}

async function seedAuthTables() {
  // @auth/pg-adapter 需要这三张表才能工作。
  // userId 用 UUID 是为了跟你项目现有的 users.id 类型对上。
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      "userId" UUID NOT NULL,
      type VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      "providerAccountId" VARCHAR(255) NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at BIGINT,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, "providerAccountId")
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      "userId" UUID NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      "sessionToken" VARCHAR(255) NOT NULL UNIQUE
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS verification_token (
      identifier TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      token TEXT NOT NULL,
      PRIMARY KEY (identifier, token)
    );
  `;
}

async function seedInvoices() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

  const insertedInvoices = await Promise.all(
    invoices.map(
      (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedInvoices;
}

async function seedCustomers() {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      phone VARCHAR(50)
    );
  `;
  // 联系方式字段：老表可能已存在但缺这一列
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`;

  const insertedCustomers = await Promise.all(
    customers.map(
      (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
    ),
  );

  return insertedCustomers;
}

async function seedRevenue() {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

  const insertedRevenue = await Promise.all(
    revenue.map(
      (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
    ),
  );

  return insertedRevenue;
}

export async function GET() {
  try {
    const result = await sql.begin((sql) => [
      seedUsers(),
      seedAuthTables(),
      seedCustomers(),
      seedInvoices(),
      seedRevenue(),
    ]);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}