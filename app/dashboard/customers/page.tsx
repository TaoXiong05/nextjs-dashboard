import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Search from '@/app/ui/search';
import CustomersFilter from '@/app/ui/customers/filter';
import Table from '@/app/ui/customers/table';
import Pagination from '@/app/ui/invoices/pagination';
import {
  CreateCustomer,
  ExportCustomers,
  ImportCustomers,
} from '@/app/ui/customers/buttons';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
import { fetchCustomersPages } from '@/app/lib/data';
import type { CustomerStatusFilter } from '@/app/lib/data';
import { auth } from '@/auth';

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;
  const status = (params?.status as CustomerStatusFilter) || 'all';

  const [totalPages, session] = await Promise.all([
    fetchCustomersPages(query, status),
    auth(),
  ]);
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      </div>
      <div className="mt-4 flex flex-col gap-2 md:mt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Search placeholder="Search by name, email or phone..." />
          <CustomersFilter />
        </div>
        <div className="flex items-center gap-2">
          <ExportCustomers />
          {isAdmin ? (
            <>
              <ImportCustomers />
              <CreateCustomer />
            </>
          ) : null}
        </div>
      </div>
      <Suspense
        key={query + currentPage + status}
        fallback={<CustomersTableSkeleton />}
      >
        <Table
          query={query}
          currentPage={currentPage}
          status={status}
          isAdmin={isAdmin}
        />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}
