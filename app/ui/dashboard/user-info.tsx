import { UserCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import type { Role } from '@/app/lib/definitions';

export default function UserInfo({
  name,
  email,
  role,
}: {
  name?: string | null;
  email?: string | null;
  role: Role;
}) {
  return (
    <div className="hidden items-center gap-3 rounded-md bg-gray-50 p-3 md:flex">
      <UserCircleIcon className="h-9 w-9 shrink-0 text-gray-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">
          {name || 'Unnamed user'}
        </p>
        <p className="truncate text-xs text-gray-500">{email}</p>
      </div>
      <span
        className={clsx(
          'shrink-0 rounded-full px-2 py-1 text-xs font-medium',
          {
            'bg-blue-600 text-white': role === 'admin',
            'bg-gray-200 text-gray-600': role === 'user',
          },
        )}
      >
        {role === 'admin' ? 'Admin' : 'User'}
      </span>
    </div>
  );
}
