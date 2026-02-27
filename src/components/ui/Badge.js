/**
 * Status badge with semantic color variants.
 * @param {object} props
 * @param {'success'|'warning'|'error'|'info'|'neutral'|'primary'|'veg'|'nonVeg'} props.variant
 */
export default function Badge({ children, variant = 'neutral', className = '' }) {
    const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    const variants = {
        neutral: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400",
        warning: "border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400",
        error: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400",
        veg: "border-green-600 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
        nonVeg: "border-red-600 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
    };

    const classes = [baseClasses, variants[variant] || variants.neutral, className].filter(Boolean).join(" ");

    return (
        <span className={classes}>
            {children}
        </span>
    );
}
