'use client';

import { useParams } from 'next/navigation';

export default function ConsumerMenuPage() {
    const params = useParams();
    const { restaurantId, tableId } = params;

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h1>Table Menu</h1>
            <p>Welcome! You have successfully joined Table: {tableId}</p>
            <p style={{ marginTop: '2rem', color: 'var(--color-text-muted)' }}>
                The consumer menu interface is currently under construction.
            </p>
        </div>
    );
}
