'use client';

import { TrashIcon } from '@heroicons/react/24/outline';
import { deleteCustomer } from '@/app/lib/customer-actions';

export default function DeleteCustomer({ id }: { id: string }) {
  const deleteCustomerWithId = deleteCustomer.bind(null, id);
  return (
    <form
      action={deleteCustomerWithId}
      onSubmit={(e) => {
        if (!confirm('确定要删除该客户吗？其关联的账单也会一并删除，此操作不可撤销。')) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-md border p-2 hover:bg-gray-100">
        <span className="sr-only">Delete</span>
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}
