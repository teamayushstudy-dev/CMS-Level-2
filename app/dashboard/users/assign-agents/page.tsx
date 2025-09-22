'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  ArrowLeft,
  Users as UsersIcon,
  UserPlus,
  UserMinus
} from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
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
  assignedAgents?: User[];
}

export default function AssignAgentsPage() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [unassignedAgents, setUnassignedAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
    }
    
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load managers with their assigned agents using dedicated endpoint
      const managersResponse = await fetch('/api/users/managers-with-agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Load unassigned agents
      const agentsResponse = await fetch('/api/users/unassigned-agents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (managersResponse.ok && agentsResponse.ok) {
        const managersData = await managersResponse.json();
        const agentsData = await agentsResponse.json();
        
        setManagers(managersData.managers);
        setUnassignedAgents(agentsData.agents);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedManager || !selectedAgent) {
      alert('Please select both a manager and an agent');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/assign-agent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          managerId: selectedManager,
          agentId: selectedAgent
        })
      });

      if (response.ok) {
        alert('Agent assigned successfully!');
        setSelectedManager('');
        setSelectedAgent('');
        loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to assign agent');
      }
    } catch (error) {
      console.error('Error assigning agent:', error);
      alert('Failed to assign agent');
    }
  };

  const handleUnassignAgent = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to unassign ${agentName}?`)) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/unassign-agent', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ agentId })
      });

      if (response.ok) {
        alert('Agent unassigned successfully!');
        loadData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to unassign agent');
      }
    } catch (error) {
      console.error('Error unassigning agent:', error);
      alert('Failed to unassign agent');
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(search.toLowerCase()) ||
    manager.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignment data...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Assign Agents to Managers</h1>
              <p className="text-gray-600">Manage agent assignments and team structure</p>
            </div>
          </div>
        </div>

        {/* Assignment Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assign Agent to Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="managerSelect">Select Manager</Label>
                <select
                  id="managerSelect"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a manager...</option>
                  {managers.map(manager => (
                    <option key={manager._id} value={manager._id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="agentSelect">Select Unassigned Agent</Label>
                <select
                  id="agentSelect"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an agent...</option>
                  {unassignedAgents.map(agent => (
                    <option key={agent._id} value={agent._id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Button
                  onClick={handleAssignAgent}
                  disabled={!selectedManager || !selectedAgent}
                  className="w-full flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Agent
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search managers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Managers and Their Assigned Agents */}
        <div className="space-y-6">
          {filteredManagers.map(manager => (
            <Card key={manager._id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {manager.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{manager.name}</h3>
                      <p className="text-sm text-gray-500">{manager.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Manager</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {manager.assignedAgents && manager.assignedAgents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manager.assignedAgents.map((agent) => (
                          <TableRow key={agent._id}>
                            <TableCell className="font-medium">{agent.name}</TableCell>
                            <TableCell>{agent.email}</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">
                                Assigned
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnassignAgent(agent._id, agent.name)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <UserMinus className="h-3 w-3" />
                                Unassign
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No agents assigned to this manager</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredManagers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No managers found</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Unassigned Agents */}
        {unassignedAgents.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Unassigned Agents ({unassignedAgents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unassignedAgents.map(agent => (
                  <div key={agent._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-sm text-gray-500">{agent.email}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Unassigned
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}