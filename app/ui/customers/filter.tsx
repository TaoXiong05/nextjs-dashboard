'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All customers' },
  { value: 'pending', label: 'Has pending balance' },
  { value: 'paid', label: 'Fully paid' },
  { value: 'none', label: 'No invoices yet' },
];

export default function CustomersFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleFilter(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="status-filter"
      name="status-filter"
      className="peer block h-10 rounded-md border border-gray-200 py-[9px] pl-3 pr-8 text-sm outline-2 placeholder:text-gray-500"
      defaultValue={searchParams.get('status')?.toString() || 'all'}
      onChange={(e) => handleFilter(e.target.value)}
      aria-label="Filter customers by status"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
