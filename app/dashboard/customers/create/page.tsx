import { redirect } from 'next/navigation';
import Form from '@/app/ui/customers/create-form';
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
            label: 'Create Customer',
            href: '/dashboard/customers/create',
            active: true,
          },
        ]}
      />
      <Form />
    </main>
  );
}
