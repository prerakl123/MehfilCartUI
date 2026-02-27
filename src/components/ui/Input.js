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

    const baseInputClasses = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
    const textareaClasses = "min-h-[80px]";
    const errorClasses = "border-destructive focus-visible:ring-destructive";

    const inputClass = [
        baseInputClasses,
        textarea ? textareaClasses : "h-9",
        error ? errorClasses : "",
        className
    ].filter(Boolean).join(" ");

    return (
        <div className="grid w-full items-center gap-1.5">
            {label && <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            <Tag id={id} type={textarea ? undefined : type} className={inputClass} {...props} />
            {error && <span className="text-[0.8rem] font-medium text-destructive">{error}</span>}
        </div>
    );
}
