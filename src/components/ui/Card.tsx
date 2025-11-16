import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className, title, subtitle }: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 shadow-sm', className)}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-200">
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn('px-6 py-4 border-b border-slate-200', className)}>{children}</div>;
}

export function CardTitle({ children, className }: CardHeaderProps) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: CardHeaderProps) {
  return <p className={cn('text-sm text-slate-600 mt-1', className)}>{children}</p>;
}

export function CardContent({ children, className }: CardHeaderProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}
