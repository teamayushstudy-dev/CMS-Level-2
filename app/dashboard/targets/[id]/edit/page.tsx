'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface Target {
  _id: string;
  title: string;
  description?: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
  assignedUsers: string[];
  isActive: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditTargetPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<Target>>({});
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params.id) {
      loadTarget();
      loadUsers();
    }
  }, [params.id]);

  const loadTarget = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/targets/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data.target,
          startDate: new Date(data.target.startDate).toISOString().split('T')[0],
          endDate: new Date(data.target.endDate).toISOString().split('T')[0],
          assignedUsers: data.target.assignedUsers.map((user: any) => user._id)
        });
      } else {
        console.error('Failed to load target');
        router.push('/dashboard/targets');
      }
    } catch (error) {
      console.error('Error loading target:', error);
      router.push('/dashboard/targets');
    } finally {
      setLoadingData(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/targets/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          targetAmount: parseFloat(formData.targetAmount?.toString() || '0')
        })
      });

      if (response.ok) {
        router.push(`/dashboard/targets/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update target');
      }
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Failed to update target');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleUserSelection = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers?.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...(prev.assignedUsers || []), userId]
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading target data...</p>
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
              onClick={() => router.push(`/dashboard/targets/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Target
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Target</h1>
          <p className="text-gray-600">Update target information</p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Target Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Target Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAmount">Target Amount *</Label>
                  <Input
                    id="targetAmount"
                    name="targetAmount"
                    type="number"
                    step="0.01"
                    value={formData.targetAmount || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    name="isActive"
                    value={formData.isActive ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Assigned Users</Label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                  {users.map(user => (
                    <label key={user._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.assignedUsers?.includes(user._id) || false}
                        onChange={() => handleUserSelection(user._id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">
                        {user.name} ({user.email}) - {user.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/targets/${params.id}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Updating...' : 'Update Target'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}