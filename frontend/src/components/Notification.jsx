import React, { useEffect, useState } from 'react';

const Notification = ({ message, type = 'info', duration = 2500, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-800',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-50 to-rose-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-800',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      text: 'text-yellow-800',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-800',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div
      className={`fixed top-6 right-6 ${isExiting ? 'animate-slide-out' : 'animate-slide-in'}`}
      style={{
        zIndex: 99999,
        animation: isExiting
          ? 'slideOut 0.3s ease-out forwards'
          : 'slideIn 0.3s ease-out forwards'
      }}
    >
      <div
        className={`${style.bg} ${style.border} border-2 rounded-xl shadow-2xl p-4 pr-12 min-w-[300px] max-w-md relative backdrop-blur-sm`}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 ${style.icon}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={style.iconPath} />
            </svg>
          </div>
          <div className={`flex-1 ${style.text} font-medium text-sm leading-relaxed`}>
            {message}
          </div>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              if (onClose) onClose();
            }, 300);
          }}
          className={`absolute top-3 right-3 ${style.icon} hover:opacity-70 transition-opacity`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }

        .animate-slide-out {
          animation: slideOut 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Notification Manager untuk multiple notifications
export const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Listen for custom notification events
    const handleNotification = (event) => {
      const { message, type, duration } = event.detail;
      const id = Date.now();
      
      setNotifications((prev) => [
        ...prev,
        { id, message, type, duration }
      ]);
    };

    window.addEventListener('show-notification', handleNotification);
    return () => window.removeEventListener('show-notification', handleNotification);
  }, []);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-6 right-6 flex flex-col gap-3" style={{ zIndex: 99999 }}>
      {notifications.map((notif, index) => (
        <div key={notif.id} style={{ marginTop: index * 10 }}>
          <Notification
            message={notif.message}
            type={notif.type}
            duration={notif.duration || 2500}
            onClose={() => removeNotification(notif.id)}
          />
        </div>
      ))}
    </div>
  );
};

// Helper function to show notifications
export const showNotification = (message, type = 'info', duration = 2500) => {
  const event = new CustomEvent('show-notification', {
    detail: { message, type, duration }
  });
  window.dispatchEvent(event);
};

export default Notification;
