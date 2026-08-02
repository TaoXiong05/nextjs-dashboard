'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : 'require',
});

const DEFAULT_AVATAR = '/customers/generic-avatar.png';

class PermissionError extends Error {}

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    throw new PermissionError('权限不足：该操作仅管理员可执行。');
  }
}

const CustomerFormSchema = z.object({
  name: z.string().trim().min(1, { message: '请填写客户姓名。' }),
  email: z.string().trim().email({ message: '请填写有效的邮箱地址。' }),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
});

export type CustomerState = {
  errors?: {
    name?: string[];
    email?: string[];
    phone?: string[];
  };
  message?: string | null;
  values?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const rawFormData = {
    name: (formData.get('name') as string) || '',
    email: (formData.get('email') as string) || '',
    phone: (formData.get('phone') as string) || '',
  };

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof PermissionError) {
      return { message: error.message, values: rawFormData };
    }
    throw error;
  }

  const validatedFields = CustomerFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '请填写完整的客户信息。',
      values: rawFormData,
    };
  }

  const { name, email, phone } = validatedFields.data;

  try {
    await sql`
      INSERT INTO customers (name, email, phone, image_url)
      VALUES (${name}, ${email}, ${phone}, ${DEFAULT_AVATAR})
    `;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
): Promise<CustomerState> {
  const rawFormData = {
    name: (formData.get('name') as string) || '',
    email: (formData.get('email') as string) || '',
    phone: (formData.get('phone') as string) || '',
  };

  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof PermissionError) {
      return { message: error.message, values: rawFormData };
    }
    throw error;
  }

  const validatedFields = CustomerFormSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '请填写完整的客户信息。',
      values: rawFormData,
    };
  }

  const { name, email, phone } = validatedFields.data;

  try {
    await sql`
      UPDATE customers
      SET name = ${name}, email = ${email}, phone = ${phone}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  revalidatePath('/dashboard/customers');
  redirect('/dashboard/customers');
}

export async function deleteCustomer(id: string) {
  await requireAdmin();

  try {
    await sql.begin(async (tx) => {
      await tx`DELETE FROM invoices WHERE customer_id = ${id}`;
      await tx`DELETE FROM customers WHERE id = ${id}`;
    });
    revalidatePath('/dashboard/customers');
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
}

export type ImportState = {
  message?: string | null;
  imported?: number;
  updated?: number;
  skipped?: number;
};

// 简单的 CSV 行解析：支持逗号分隔和双引号包裹字段
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export async function importCustomersCsv(
  prevState: ImportState,
  formData: FormData,
): Promise<ImportState> {
  await requireAdmin();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { message: '请选择一个 CSV 文件。' };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return { message: 'CSV 文件为空或缺少数据行。' };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf('name');
  const emailIdx = header.indexOf('email');
  const phoneIdx = header.indexOf('phone');

  if (nameIdx === -1 || emailIdx === -1) {
    return { message: 'CSV 表头必须包含 name 和 email 列（phone 列可选）。' };
  }

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  try {
    for (const line of lines.slice(1)) {
      const fields = parseCsvLine(line);
      const name = fields[nameIdx]?.trim();
      const email = fields[emailIdx]?.trim();
      const phone = phoneIdx !== -1 ? fields[phoneIdx]?.trim() || null : null;

      const parsed = CustomerFormSchema.safeParse({ name, email, phone: phone ?? undefined });
      if (!parsed.success) {
        skipped++;
        continue;
      }

      const existing = await sql`
        SELECT id FROM customers WHERE email = ${parsed.data.email} LIMIT 1
      `;

      if (existing.length > 0) {
        await sql`
          UPDATE customers
          SET name = ${parsed.data.name}, phone = COALESCE(${parsed.data.phone}, phone)
          WHERE id = ${existing[0].id}
        `;
        updated++;
      } else {
        await sql`
          INSERT INTO customers (name, email, phone, image_url)
          VALUES (${parsed.data.name}, ${parsed.data.email}, ${parsed.data.phone}, ${DEFAULT_AVATAR})
        `;
        imported++;
      }
    }
  } catch (error) {
    console.error('Error importing customers:', error);
    return { message: '导入过程中发生数据库错误。', imported, updated, skipped };
  }

  revalidatePath('/dashboard/customers');
  return {
    message: `导入完成：新增 ${imported} 条，更新 ${updated} 条，跳过 ${skipped} 条无效数据。`,
    imported,
    updated,
    skipped,
  };
}
