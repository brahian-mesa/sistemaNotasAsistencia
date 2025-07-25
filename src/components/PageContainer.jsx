import React from 'react';

const PageContainer = ({ children, title, subtitle }) => {
    return (
        <div className="h-full w-full flex flex-col lg:overflow-hidden overflow-auto">
            {title && (
                <div className="text-center mb-6 flex-shrink-0">
                    <h1 className="text-3xl font-bold text-black mb-2">{title}</h1>
                    {subtitle && (
                        <p className="text-base text-black/70">{subtitle}</p>
                    )}
                </div>
            )}
            <div className="flex-1 lg:overflow-hidden overflow-visible">
                {children}
            </div>
        </div>
    );
};

export default PageContainer; 