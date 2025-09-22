'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  assignedBy?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Manager {
  _id: string;
  name: string;
  email: string;
}

export default function EditUserPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [assignedManager, setAssignedManager] = useState<string>('');
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Load managers if admin
      if (user.role === 'admin') {
        loadManagers();
      }
    }
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const getRoleOptions = () => {
    if (currentUser?.role === 'admin') {
      return ['admin', 'manager', 'agent'];
    } else if (currentUser?.role === 'manager') {
      return ['agent'];
    }
    return ['agent'];
  };

  useEffect(() => {
    if (params.id) {
      loadUser();
      if (currentUser?.role === 'admin') {
        loadManagers();
      }
    }
  }, [params.id, currentUser]);

  const loadManagers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=manager', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setManagers(data.users);
      }
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(data.user);
        setAssignedManager(data.user.assignedBy?._id || '');
      } else {
        console.error('Failed to load user');
        router.push('/dashboard/users');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      router.push('/dashboard/users');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle agent assignment change for admins
      if (currentUser?.role === 'admin' && formData.role === 'agent' && assignedManager !== (formData.assignedBy?._id || '')) {
        if (assignedManager) {
          await handleAssignAgent(assignedManager);
        } else if (formData.assignedBy) {
          await handleUnassignAgent();
        }
      }

      const token = localStorage.getItem('token');
      const updateData: any = { ...formData };

      // Add password if provided
      if (passwordData.newPassword) {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
          alert('Passwords do not match');
          setLoading(false);
          return;
        }
        updateData.password = passwordData.newPassword;
      }

      const response = await fetch(`/api/users/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        router.push(`/dashboard/users/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async (managerId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/users/assign-agent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          managerId,
          agentId: params.id
        })
      });
    } catch (error) {
      console.error('Error assigning agent:', error);
    }
  };

  const handleUnassignAgent = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/users/unassign-agent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: params.id
        })
      });
    } catch (error) {
      console.error('Error unassigning agent:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/users/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to User
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
          <p className="text-gray-600">Update user information and settings</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role *</Label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role || ''}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getRoleOptions().map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show manager assignment only for admins editing agents */}
                {currentUser?.role === 'admin' && formData.role === 'agent' && (
                  <div>
                    <Label htmlFor="assignedManager">Assigned Manager</Label>
                    <select
                      id="assignedManager"
                      value={assignedManager}
                      onChange={(e) => setAssignedManager(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Manager Assigned</option>
                      {managers.map(manager => (
                        <option key={manager._id} value={manager._id}>
                          {manager.name} ({manager.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive || false}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isActive">Active Account</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <p className="text-sm text-gray-600">Leave blank to keep current password</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/users/${params.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}