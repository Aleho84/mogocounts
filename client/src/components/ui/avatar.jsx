import React from 'react';

const Avatar = ({
    name = '?',
    size = 'md',
    isActive = true,
    className = ''
}) => {
    const initial = typeof name === 'string' && name.length > 0
        ? name.charAt(0).toUpperCase()
        : '?';

    const sizes = {
        sm: 'w-5 h-5 text-[10px]',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-3xl' // For empty state or large headers
    };

    const activeStyles = 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20';
    const activeFlatStyles = 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'; // Optional alternative
    const activeWhiteStyles = 'bg-white text-indigo-500 shadow-md'; // Optional for the small active pills
    
    // Instead of forcing a single style, we can map variants if needed, or stick to standard.
    // The requirement was to unify them so let's stick to the beautiful gradient for active and slate for inactive.
    const finalStyle = isActive 
        ? activeStyles 
        : 'bg-slate-700 text-slate-400 border border-transparent';

    return (
        <div className={`rounded-full flex items-center justify-center font-bold shrink-0 transition-all ${sizes[size]} ${finalStyle} ${className}`}>
            {initial}
        </div>
    );
};

export default Avatar;
