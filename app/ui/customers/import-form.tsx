'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { importCustomersCsv, ImportState } from '@/app/lib/customer-actions';

export default function ImportForm() {
  const initialState: ImportState = { message: null };
  const [state, formAction] = useActionState(importCustomersCsv, initialState);

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        <p className="mb-4 text-sm text-gray-600">
          Upload a CSV file with a header row containing{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5">name</code>,{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5">email</code> and
          optionally <code className="rounded bg-gray-100 px-1 py-0.5">phone</code>{' '}
          columns. Existing customers are matched by email and updated;
          everyone else is created. The same file can be opened and re-saved
          from Excel.
        </p>
        <div className="mb-4">
          <label htmlFor="file" className="mb-2 block text-sm font-medium">
            CSV file
          </label>
          <div className="relative">
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5"
            />
            <DocumentArrowUpIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {state.message ? (
            <p className="mt-2 text-sm text-gray-700">{state.message}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/customers"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Back
        </Link>
        <Button type="submit">Import</Button>
      </div>
    </form>
  );
}
