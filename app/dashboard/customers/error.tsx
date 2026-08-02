'use client';

import { useRouter } from 'next/navigation';
import { useEffect, startTransition } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error(error);
    }, [error]);

    const handleCustomReset = () => {
        startTransition(() => {
            router.replace('/dashboard/customers');
        });
    };

    return (
        <main className="flex h-full flex-col items-center justify-center">
            <h2 className="text-center">Something went wrong!</h2>
            <button
                className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
                onClick={handleCustomReset}
            >
                Try again
            </button>
        </main>
    );
}
