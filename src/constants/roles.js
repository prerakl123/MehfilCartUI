/**
 * Role labels for UI visibility decisions (show/hide elements).
 * Authorization enforcement is handled entirely by the backend.
 */

export const ROLES = Object.freeze({
  SUPER_ADMIN: 'SUPER_ADMIN',
  RESTAURANT_ADMIN: 'RESTAURANT_ADMIN',
  WAITER: 'WAITER',
  TABLE_HOST: 'TABLE_HOST',
  TABLE_GUEST: 'TABLE_GUEST',
});

/** Human-readable role labels for display purposes. */
export const ROLE_LABELS = Object.freeze({
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.RESTAURANT_ADMIN]: 'Restaurant Admin',
  [ROLES.WAITER]: 'Waiter',
  [ROLES.TABLE_HOST]: 'Host',
  [ROLES.TABLE_GUEST]: 'Guest',
});

/**
 * UI visibility helpers -- used to conditionally render UI elements.
 * These do NOT enforce authorization; the backend rejects unauthorized requests regardless.
 */
export function isAdminRole(role) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.RESTAURANT_ADMIN;
}

export function isStaffRole(role) {
  return role === ROLES.WAITER;
}

export function isSessionRole(role) {
  return role === ROLES.TABLE_HOST || role === ROLES.TABLE_GUEST;
}

export function isHost(role) {
  return role === ROLES.TABLE_HOST;
}
