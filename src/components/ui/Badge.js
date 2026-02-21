import styles from './Badge.module.css';

/**
 * Status badge with semantic color variants.
 * @param {'success'|'warning'|'error'|'info'|'neutral'|'primary'|'veg'|'nonVeg'} variant
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
    return (
        <span className={`${styles.badge} ${styles[variant]} ${className}`}>
            {children}
        </span>
    );
}
