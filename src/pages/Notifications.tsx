
import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, Calendar, Users, FileText } from 'lucide-react';

// Mock notification data
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Assignment Due Soon",
    description: "Your 'Math Equations' assignment is due tomorrow at 11:59 PM.",
    date: "2025-04-22T16:00:00",
    read: false,
    type: "assignment",
    action: "/assignments"
  },
  {
    id: "2",
    title: "Learning Style Analysis Complete",
    description: "Your learning style analysis is now available. View your results to get personalized recommendations.",
    date: "2025-04-21T13:30:00",
    read: true,
    type: "learning",
    action: "/learning-style"
  },
  {
    id: "3",
    title: "New Classroom Invitation",
    description: "You've been invited to join 'Advanced Physics' classroom.",
    date: "2025-04-20T10:15:00",
    read: false,
    type: "classroom",
    action: "/classrooms"
  },
  {
    id: "4",
    title: "Feedback Received",
    description: "Your teacher has provided feedback on your 'Literary Analysis' assignment.",
    date: "2025-04-19T15:45:00",
    read: false,
    type: "feedback",
    action: "/ai-tutor"
  }
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "learning":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "classroom":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "feedback":
        return <FileText className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Bell className="mr-2 h-6 w-6" />
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="ml-3 bg-edu-primary text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-colors ${!notification.read ? "border-l-4 border-l-edu-primary" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div>
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {notification.description}
                        </CardDescription>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.date)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="flex justify-end space-x-2 mt-2">
                    {!notification.read && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.location.href = notification.action}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                You're all caught up! Check back later for new notifications.
              </p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Notifications;
