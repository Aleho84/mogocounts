import React from 'react';

const Input = ({
    label,
    error,
    icon: Icon,
    className = '',
    containerClassName = '',
    ...props
}) => {
    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={`
                        w-full bg-slate-800/50 border border-slate-700 
                        text-slate-100 text-sm rounded-xl 
                        focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
                        block p-2.5 transition-all duration-200
                        placeholder-slate-500
                        ${Icon ? 'pl-10' : ''}
                        ${error ? 'border-rose-500 focus:ring-rose-500' : ''}
                        ${className}
                    `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-rose-500 ml-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
