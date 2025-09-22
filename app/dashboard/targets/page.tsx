'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Target as TargetIcon
} from 'lucide-react';

interface Target {
  _id: string;
  targetId: string;
  title: string;
  targetAmount: number;
  achievedAmount: number;
  remainingAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  assignedUsers: Array<{
    name: string;
    email: string;
  }>;
  createdAt: string;
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadTargets();
  }, [currentPage, search, activeFilter]);

  const loadTargets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(activeFilter && { active: activeFilter })
      });

      const response = await fetch(`/api/targets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTargets(data.targets);
        setTotalPages(data.pagination.pages);
      } else {
        console.error('Failed to load targets');
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (achieved: number, target: number) => {
    return Math.min((achieved / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/targets/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadTargets();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading targets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Target Management</h1>
              <p className="text-gray-600">Set and track sales targets for your team</p>
            </div>
            
            <Button
              onClick={() => router.push('/dashboard/targets/new')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Target
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search targets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Targets</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Targets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TargetIcon className="h-5 w-5" />
              Targets ({targets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Target Amount</TableHead>
                    <TableHead>Achieved</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Assigned Users</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targets.map((target) => {
                    const progressPercentage = getProgressPercentage(target.achievedAmount, target.targetAmount);
                    return (
                      <TableRow key={target._id}>
                        <TableCell className="font-medium">{target.title}</TableCell>
                        <TableCell>${target.targetAmount.toLocaleString()}</TableCell>
                        <TableCell>${target.achievedAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(progressPercentage)}`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={target.remainingAmount <= 0 ? 'text-green-600 font-semibold' : ''}>
                            ${target.remainingAmount.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(target.startDate).toLocaleDateString()}</div>
                            <div className="text-gray-500">to</div>
                            <div>{new Date(target.endDate).toLocaleDateString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {target.assignedUsers.slice(0, 2).map((user, index) => (
                              <div key={index}>{user.name}</div>
                            ))}
                            {target.assignedUsers.length > 2 && (
                              <div className="text-gray-500">
                                +{target.assignedUsers.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={target.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {target.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/targets/${target._id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/targets/${target._id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(target._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}