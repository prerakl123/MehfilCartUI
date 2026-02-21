import styles from './Input.module.css';

/**
 * Form input component with label and error display.
 */
export default function Input({
    label,
    error,
    type = 'text',
    textarea = false,
    className = '',
    id,
    ...props
}) {
    const Tag = textarea ? 'textarea' : 'input';
    const inputClass = [
        styles.input,
        textarea && styles.textarea,
        error && styles.inputError,
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={styles.inputGroup}>
            {label && <label htmlFor={id} className={styles.label}>{label}</label>}
            <Tag id={id} type={textarea ? undefined : type} className={inputClass} {...props} />
            {error && <span className={styles.errorText}>{error}</span>}
        </div>
    );
}
