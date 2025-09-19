import { ChevronDown } from 'lucide-react';
import * as React from 'react';

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const SelectContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, value, onValueChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
      <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
        <div ref={ref} className={`relative ${className}`} {...props}>
          {children}
        </div>
      </SelectContext.Provider>
    );
  }
);
Select.displayName = 'Select';

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen } = React.useContext(SelectContext);

  return (
    <button
      ref={ref}
      type="button"
      className={`flex h-10 w-full items-center justify-between border border-dashed border-white/20 bg-black/30 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50 rounded-none ${className}`}
      onClick={() => setIsOpen(!isOpen)}
      {...props}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const { value } = React.useContext(SelectContext);

  return (
    <span ref={ref} className={`text-sm text-white ${className}`} {...props}>
      {value || placeholder}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = React.useContext(SelectContext);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={`absolute top-full left-0 right-0 z-50 mt-1 border border-dashed border-white/20 bg-black/90 rounded-none shadow-lg ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const { onValueChange, setIsOpen } = React.useContext(SelectContext);

  return (
    <div
      ref={ref}
      className={`px-3 py-2 text-sm text-white hover:bg-white/10 cursor-pointer ${className}`}
      onClick={() => {
        onValueChange?.(value);
        setIsOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
