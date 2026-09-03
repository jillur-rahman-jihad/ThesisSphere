import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, Calendar, Video, FileText, Check, Trash2, CheckCircle2 } from 'lucide-react';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead, deleteNotification, unreadCount } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Video className="w-5 h-5 text-indigo-500" />;
      case 'deadline':
        return <Calendar className="w-5 h-5 text-rose-500" />;
      case 'general':
      default:
        return <Bell className="w-5 h-5 text-amber-500" />;
    }
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Notifications
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            You have {unreadCount} unread notification{unreadCount !== 1 && 's'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors font-medium text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-12">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">No notifications yet</h3>
            <p className="text-slate-500 dark:text-slate-400">When you receive notifications, they will appear here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-2xl border transition-all ${
                notification.isRead 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-75 hover:opacity-100' 
                  : 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
              }`}
            >
              <div className="flex gap-4">
                <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  notification.isRead ? 'bg-slate-100 dark:bg-slate-700' : 'bg-white dark:bg-slate-800 shadow-sm'
                }`}>
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className={`font-semibold text-base truncate ${
                      notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  
                  <p className={`mt-1 text-sm ${
                    notification.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <div className="mt-3 flex gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
                
                {!notification.isRead && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
