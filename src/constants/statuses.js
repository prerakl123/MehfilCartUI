/** Session and order status enums for the MehfilCart platform. */

export const SESSION_STATUS = Object.freeze({
    CREATED: 'CREATED',
    ACTIVE: 'ACTIVE',
    LOCKED: 'LOCKED',
    TIMED_OUT: 'TIMED_OUT',
    SUBMITTED: 'SUBMITTED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CLOSED: 'CLOSED',
});

export const ORDER_STATUS = Object.freeze({
    RECEIVED: 'RECEIVED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    SERVED: 'SERVED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
});

export const MEMBER_STATUS = Object.freeze({
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    LEFT: 'LEFT',
});

export const DIET_TYPE = Object.freeze({
    VEG: 'VEG',
    NON_VEG: 'NON_VEG',
    VEGAN: 'VEGAN',
    EGGETARIAN: 'EGGETARIAN',
});
