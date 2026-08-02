import { auth } from '@/auth';
import { fetchAllCustomersForExport } from '@/app/lib/data';

function csvEscape(value: string | number) {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const customers = await fetchAllCustomersForExport();

  const header = ['name', 'email', 'phone', 'total_invoices', 'total_pending_cents', 'total_paid_cents'];
  const rows = customers.map((c) =>
    [c.name, c.email, c.phone ?? '', c.total_invoices, c.total_pending, c.total_paid]
      .map(csvEscape)
      .join(','),
  );
  const csv = [header.join(','), ...rows].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="customers.csv"',
    },
  });
}
