import React from 'react';
import { cn } from '../lib/utils';

/**
 * Card Component - Base container with glass effect
 */
export const Card = React.memo(({ children, className, hover = true, ...props }) => {
    return (
        <div
            className={cn(
                'glass-panel p-6',
                hover && 'card',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

/**
 * Button Component - Professional button variants
 */
export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    disabled,
    ...props
}) => {
    const baseStyles = 'btn';

    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
    };

    const sizes = {
        sm: 'text-sm px-3 py-1.5',
        md: 'px-4 py-2',
        lg: 'text-lg px-6 py-3',
    };

    return (
        <button
            className={cn(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

/**
 * Badge Component - Status indicators
 */
export const Badge = ({ children, variant = 'primary', className }) => {
    const variants = {
        primary: 'badge-primary',
        success: 'badge-success',
        warning: 'badge-warning',
        danger: 'badge-danger',
        info: 'badge-info',
    };

    return (
        <span className={cn('badge', variants[variant], className)}>
            {children}
        </span>
    );
};

/**
 * Skeleton Loader - Loading placeholder
 */
export const Skeleton = ({ className, width, height }) => {
    return (
        <div
            className={cn('skeleton', className)}
            style={{
                width: width || '100%',
                height: height || '1rem',
            }}
        />
    );
};

/**
 * KPI Card - Premium dashboard metric card
 */
export const KPICard = React.memo(({
    title,
    value,
    trend,
    trendValue,
    icon: Icon,
    color = 'indigo',
    className
}) => {
    const colors = {
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', value: 'text-indigo-700' },
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', value: 'text-cyan-700' },
        pink: { bg: 'bg-pink-50', text: 'text-pink-600', value: 'text-pink-700' },
        green: { bg: 'bg-green-50', text: 'text-green-600', value: 'text-green-700' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', value: 'text-purple-700' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', value: 'text-emerald-700' },
    };

    const colorScheme = colors[color] || colors.indigo;

    return (
        <Card className={cn('fade-in', className)}>
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className={cn('text-3xl font-bold', colorScheme.value)}>{value}</h3>
                    {trend && trendValue && (
                        <div className="flex items-center gap-1 mt-2">
                            <span className={cn(
                                'text-xs font-medium',
                                trend === 'up' ? 'text-emerald-600' :
                                    trend === 'down' ? 'text-red-600' : 'text-gray-500'
                            )}>
                                {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {trendValue}
                            </span>
                            <span className="text-xs text-gray-400">vs mes anterior</span>
                        </div>
                    )}
                </div>
                {Icon && (
                    <div className={cn('p-3 rounded-lg', colorScheme.bg, colorScheme.text)}>
                        <Icon size={24} />
                    </div>
                )}
            </div>
        </Card>
    );
});

/**
 * Empty State - Placeholder for empty data
 */
export const EmptyState = ({
    title = 'No hay datos',
    description,
    icon: Icon,
    action
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {Icon && (
                <div className="mb-4 p-3 bg-gray-100 rounded-full text-gray-400">
                    <Icon size={32} />
                </div>
            )}
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 mb-4 max-w-sm">{description}</p>
            )}
            {action}
        </div>
    );
};
