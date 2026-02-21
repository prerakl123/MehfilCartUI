import styles from './Button.module.css';

/**
 * Reusable button component with variants and loading state.
 * @param {object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.loading
 * @param {boolean} props.fullWidth
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) {
    const classes = [
        styles.btn,
        styles[variant],
        size !== 'md' && styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} disabled={disabled || loading} {...props}>
            {loading && <span className={styles.spinner} />}
            {children}
        </button>
    );
}
