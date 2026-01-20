import React from 'react';

const Card = ({
    children,
    className = '',
    glass = false,
    noPadding = false,
    onClick,
    ...props
}) => {
    return (
        <div
            className={`
                relative overflow-hidden
                ${glass ? 'glass' : 'bg-slate-800 border border-slate-700'} 
                ${noPadding ? '' : 'p-4'}
                rounded-2xl
                ${onClick ? 'cursor-pointer transition-transform active:scale-[0.98]' : ''}
                ${className}
            `}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
