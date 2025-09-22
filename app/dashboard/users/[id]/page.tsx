'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User } from 'lucide-react';

interface UserDetail {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  assignedBy?: {
    name: string;
    email: string;
  };
  assignedAgents?: Array<{
    name: string;
    email: string;
  }>;
  lastLogin?: string;
  createdAt: string;
}

export default function UserDetailPage() {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-800',
      'manager': 'bg-blue-100 text-blue-800',
      'agent': 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (params.id) {
      loadUser();
    }
  }, [params.id]);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        console.error('Failed to load user');
        router.push('/dashboard/users');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <Button onClick={() => router.push('/dashboard/users')} className="mt-4">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/users')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="text-gray-600">{user.name}</p>
            </div>
            
            <Button
              onClick={() => router.push(`/dashboard/users/${user._id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit User
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold">{user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-lg">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="mt-1">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Login</label>
                    <p className="text-lg">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created Date</label>
                    <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user.assignedBy && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.assignedBy.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.assignedBy.name}</p>
                      <p className="text-sm text-gray-500">{user.assignedBy.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.assignedAgents && user.assignedAgents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Agents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {user.assignedAgents.map((agent, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {agent.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-gray-500">{agent.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">User ID</label>
                  <p className="text-sm font-mono">{user._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Created</label>
                  <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Status</label>
                  <p className="text-sm">{user.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.role === 'admin' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">Full Access</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• All CRUD operations</li>
                      <li>• User management</li>
                      <li>• Activity history access</li>
                      <li>• Import/Export all modules</li>
                      <li>• Delete operations</li>
                    </ul>
                  </div>
                )}
                
                {user.role === 'manager' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">Manager Access</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• CRUD (No Delete) on business modules</li>
                      <li>• Limited user management</li>
                      <li>• Import/Export business modules</li>
                      <li>• Access to own + assigned agents' data</li>
                    </ul>
                  </div>
                )}
                
                {user.role === 'agent' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-green-600">Agent Access</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• CRUD (No Delete) on leads, orders, payments</li>
                      <li>• Access to own data only</li>
                      <li>• No import/export capabilities</li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}