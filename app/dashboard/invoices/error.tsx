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
        // Optionally log the error to an error reporting service
        console.error(error);
    }, [error]);

    const handleCustomReset = () => {
        // startTransition 告诉 React 这是一个低优先级的非阻塞过渡更新
        startTransition(() => {
            // 1. 强迫服务器重新运行当前的 Page 页面（重新查询 MySQL / Postgres 数据库）
            router.replace('/dashboard/invoices');

            // 2. 紧接着，原地重置前端的崩溃组件状态
            // reset();
        });
    };

    return (
        <main className="flex h-full flex-col items-center justify-center">
            <h2 className="text-center">Something went wrong!</h2>
            <button
                className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
                onClick={
                    // Attempt to recover by trying to re-render the invoices route
                    handleCustomReset
                }
            >
                Try again
            </button>
        </main>
    );
}