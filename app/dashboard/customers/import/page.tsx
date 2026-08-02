import { redirect } from 'next/navigation';
import ImportForm from '@/app/ui/customers/import-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    redirect('/dashboard/customers');
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Import Customers',
            href: '/dashboard/customers/import',
            active: true,
          },
        ]}
      />
      <ImportForm />
    </main>
  );
}
