import Image from 'next/image';
import Link from 'next/link';
import { UpdateCustomer } from '@/app/ui/customers/buttons';
import DeleteCustomer from '@/app/ui/customers/delete-customer-button';
import { fetchFilteredCustomers } from '@/app/lib/data';
import type { CustomerStatusFilter } from '@/app/lib/data';

export default async function CustomersTable({
  query,
  currentPage,
  status,
  isAdmin,
}: {
  query: string;
  currentPage: number;
  status: CustomerStatusFilter;
  isAdmin: boolean;
}) {
  const customers = await fetchFilteredCustomers(query, currentPage, status);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden rounded-md bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {customers.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                No customers found.
              </p>
            ) : null}
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      <div className="flex items-center gap-3">
                        <Image
                          src={customer.image_url}
                          className="rounded-full"
                          alt={`${customer.name}'s profile picture`}
                          width={28}
                          height={28}
                        />
                        <p>{customer.name}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-sm text-gray-500">
                      {customer.phone || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between border-b py-5">
                  <div className="flex w-1/2 flex-col">
                    <p className="text-xs">Pending</p>
                    <p className="font-medium">{customer.total_pending}</p>
                  </div>
                  <div className="flex w-1/2 flex-col">
                    <p className="text-xs">Paid</p>
                    <p className="font-medium">{customer.total_paid}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 text-sm">
                  <Link
                    href={`/dashboard/invoices?customerId=${customer.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {customer.total_invoices} invoices
                  </Link>
                  {isAdmin ? (
                    <div className="flex justify-end gap-2">
                      <UpdateCustomer id={customer.id} />
                      <DeleteCustomer id={customer.id} />
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full rounded-md text-gray-900 md:table">
            <thead className="rounded-md bg-gray-50 text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Phone
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Total Invoices
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Total Pending
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Total Paid
                </th>
                {isAdmin ? (
                  <th scope="col" className="relative py-3 pl-6 pr-3">
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-gray-900">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="bg-white py-10 text-center text-sm text-gray-500"
                  >
                    No customers found.
                  </td>
                </tr>
              ) : null}
              {customers.map((customer) => (
                <tr key={customer.id} className="group">
                  <td className="whitespace-nowrap bg-white py-5 pl-4 pr-3 text-sm text-black group-first-of-type:rounded-md group-last-of-type:rounded-md sm:pl-6">
                    <div className="flex items-center gap-3">
                      <Image
                        src={customer.image_url}
                        className="rounded-full"
                        alt={`${customer.name}'s profile picture`}
                        width={28}
                        height={28}
                      />
                      <p>{customer.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap bg-white px-3 py-5 text-sm">
                    {customer.email}
                  </td>
                  <td className="whitespace-nowrap bg-white px-3 py-5 text-sm">
                    {customer.phone || '—'}
                  </td>
                  <td className="whitespace-nowrap bg-white px-3 py-5 text-sm">
                    <Link
                      href={`/dashboard/invoices?customerId=${customer.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {customer.total_invoices}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap bg-white px-3 py-5 text-sm">
                    {customer.total_pending}
                  </td>
                  <td className="whitespace-nowrap bg-white px-3 py-5 text-sm group-first-of-type:rounded-md group-last-of-type:rounded-md">
                    {customer.total_paid}
                  </td>
                  {isAdmin ? (
                    <td className="whitespace-nowrap bg-white py-5 pl-6 pr-3 text-sm group-first-of-type:rounded-md group-last-of-type:rounded-md">
                      <div className="flex justify-end gap-3">
                        <UpdateCustomer id={customer.id} />
                        <DeleteCustomer id={customer.id} />
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
