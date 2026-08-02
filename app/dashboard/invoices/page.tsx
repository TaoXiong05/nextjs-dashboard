import Link from 'next/link';
import { XCircleIcon } from '@heroicons/react/24/outline';
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchCustomerById, fetchInvoicesPages } from '@/app/lib/data';

export default async function Page({searchParams}: { searchParams?:  Promise<{ query?: string; page?: string; customerId?: string; } > }) {
  const params = await searchParams;
  const query = params?.query || '';
  const currentPage = Number(params?.page) || 1;
  const customerId = params?.customerId || null;

  const [totalPages, customer] = await Promise.all([
    fetchInvoicesPages(query, customerId),
    customerId ? fetchCustomerById(customerId) : Promise.resolve(undefined),
  ]);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      {customerId ? (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700">
          <span>
            Showing invoices for{' '}
            <span className="font-medium">{customer?.name ?? 'this customer'}</span>
          </span>
          <Link
            href="/dashboard/invoices"
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <XCircleIcon className="h-4 w-4" />
            Clear filter
          </Link>
        </div>
      ) : null}
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        <CreateInvoice />
      </div>
       <Suspense key={query + currentPage + customerId} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} customerId={customerId} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}