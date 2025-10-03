import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Shield, Users, GraduationCap } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
  last_active: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'teacher' | 'student';
  assigned_at: string;
  assigned_by?: string;
}

export const UserRoleManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all users using secure admin function
      // This function checks admin role at the database level and only returns
      // email addresses to actual admins for legitimate user management
      const { data: usersData, error: usersError } = await supabase
        .rpc('get_all_profiles_admin');

      if (usersError) throw usersError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      setUsers(usersData || []);
      setUserRoles(rolesData || []);
    } catch (error) {
      console.error('Error fetching users and roles:', error);
      toast({
        title: "Error",
        description: "Failed to load users and roles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const assignRole = async (userId: string, newRole: 'admin' | 'teacher' | 'student') => {
    try {
      // Insert new role (will trigger sync to profiles table)
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          assigned_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}.`,
      });

      // Refresh data
      await fetchUsersAndRoles();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(role => role.user_id === userId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'teacher':
        return <GraduationCap className="h-4 w-4" />;
      case 'student':
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'teacher':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const roles = getUserRoles(user.id);
              return (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium">{user.name}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Current Role Badge */}
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center space-x-1">
                        {getRoleIcon(user.role)}
                        <span className="capitalize">{user.role}</span>
                      </Badge>
                    </div>

                    {/* Role Assignment */}
                    <Select
                      value={user.role}
                      onValueChange={(newRole: 'admin' | 'teacher' | 'student') => 
                        assignRole(user.id, newRole)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};