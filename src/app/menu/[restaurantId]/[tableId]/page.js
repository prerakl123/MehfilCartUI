'use client';

import { useParams } from 'next/navigation';

export default function ConsumerMenuPage() {
    const params = useParams();
    const { tableId } = params;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-background">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4">Table Menu</h1>
            <p className="text-lg text-foreground mb-8">Welcome! You have successfully joined Table: <span className="font-mono font-semibold">{tableId}</span></p>
            <p className="mt-8 text-sm text-muted-foreground rounded-lg border border-dashed border-border bg-card/50 p-6 max-w-md">
                The consumer menu interface is currently under construction.
            </p>
        </div>
    );
}
