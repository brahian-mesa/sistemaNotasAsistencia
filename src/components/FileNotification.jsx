import React, { useState, useEffect } from 'react';

const FileNotification = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleDataChange = (event) => {
            const { type, data, timestamp } = event.detail;

            const newNotification = {
                id: Date.now(),
                message: `📁 Archivo ${type} guardado exitosamente`,
                type: 'success',
                timestamp: new Date(timestamp).toLocaleTimeString()
            };

            setNotifications(prev => [...prev, newNotification]);

            // Remover notificación después de 3 segundos
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
            }, 3000);
        };

        window.addEventListener('dataChanged', handleDataChange);

        return () => {
            window.removeEventListener('dataChanged', handleDataChange);
        };
    }, []);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
                <div
                    key={notification.id}
                    className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${notification.type === 'success'
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="mr-2">
                                {notification.type === 'success' ? '✅' : '📁'}
                            </span>
                            <div>
                                <p className="font-medium">{notification.message}</p>
                                <p className="text-xs opacity-75">{notification.timestamp}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className="ml-2 text-white hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FileNotification; 