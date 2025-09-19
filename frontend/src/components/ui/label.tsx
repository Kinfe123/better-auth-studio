import * as React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return <label className={`text-sm font-light text-white ${className}`} ref={ref} {...props} />;
});
Label.displayName = 'Label';

export { Label };
