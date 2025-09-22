'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { 
  Download, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Target as TargetIcon
} from 'lucide-react';

interface AnalyticsData {
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  monthlyTrends: Array<{ month: string; leads: number; sales: number; revenue: number }>;
  agentPerformance: Array<{ 
    agentName: string; 
    totalLeads: number; 
    followups: number;
    salePaymentDone: number;
    engines: number;
    transmissions: number;
    parts: number;
    totalPitchedProductPrice: number;
    totalProductPrice: number;
    tentativeMargin: number;
  }>;
  agentPerformanceProductPurchased: Array<{
    agentName: string;
    totalLeads: number;
    converted: number;
    engines: number;
    transmissions: number;
    parts: number;
    totalSalesPrice: number;
    totalCostPrice: number;
    totalMarginTentative: number;
  }>;
  teamPerformance: {
    totalLeads: number;
    converted: number;
    followups: number;
    salesPaymentDone: number;
    totalSalesPrice: number;
    totalCostPrice: number;
    totalMarginTentative: number;
  };
  paymentMethods: Array<{ method: string; count: number; totalAmount: number }>;
  productTypes: Array<{ type: string; count: number; revenue: number }>;
  stateDistribution: Array<{ state: string; count: number }>;
  tentativeReport: {
    monthlyTarget: number;
    dailyTarget: number;
    targetAsOfToday: number;
    marginAchievedTillDate: number;
    todayCalls: number;
    todayEngines: number;
    todayParts: number;
    todayAchieved: number;
    tentativeFollowups: number;
    tentativeSales: number;
    tentativeMargin: number;
  };
  summary: {
    totalLeads: number;
    totalRevenue: number;
    averageLeadValue: number;
    conversionRate: number;
    totalMargin: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [dateFilter, setDateFilter] = useState('today');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    
    // Set default date range to today
    const today = new Date().toISOString().split('T')[0];
    setDateRange({
      startDate: today,
      endDate: today
    });
    
    loadUsers();
  }, []);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      loadAnalytics();
    }
  }, [dateRange, selectedUsers]);
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(selectedUsers.length > 0 && { userIds: selectedUsers.join(',') })
      });

      const response = await fetch(`/api/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleDateFilterChange = (filter: string) => {
    setDateFilter(filter);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    switch (filter) {
      case 'today':
        setDateRange({
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'yesterday':
        setDateRange({
          startDate: yesterday.toISOString().split('T')[0],
          endDate: yesterday.toISOString().split('T')[0]
        });
        break;
      case 'thisWeek':
        setDateRange({
          startDate: startOfWeek.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        });
        break;
      case 'custom':
        // Keep current dates for custom range
        break;
    }
  };

  const downloadTableAsExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const calculateColumnTotals = (data: any[], numericColumns: string[]) => {
    const totals: any = {};
    numericColumns.forEach(column => {
      totals[column] = data.reduce((sum, row) => sum + (row[column] || 0), 0);
    });
    return totals;
  };

  const handleDownloadReport = async (format: 'excel' | 'pdf') => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format,
        ...(selectedUsers.length > 0 && { userIds: selectedUsers.join(',') })
      });

      const response = await fetch(`/api/analytics/download?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600">Comprehensive analytics for leads, sales, and team performance</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('excel')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDownloadReport('pdf')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Quick Date Filters</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                <Button
                  variant={dateFilter === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('today')}
                >
                  Today ({new Date().toLocaleDateString()})
                </Button>
                <Button
                  variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('yesterday')}
                >
                  Yesterday ({new Date(Date.now() - 86400000).toLocaleDateString()})
                </Button>
                <Button
                  variant={dateFilter === 'thisWeek' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('thisWeek')}
                >
                  This Week
                </Button>
                <Button
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDateFilterChange('custom')}
                >
                  Custom Range
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                  setDateFilter('custom');
                }}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                  setDateFilter('custom');
                }}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-3">
              <Label>Selected Users ({selectedUsers.length})</Label>
              <div className="mt-1 max-h-32 overflow-y-auto border rounded-md p-2">
                <label className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === 0}
                    onChange={() => setSelectedUsers([])}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">All Users</span>
                </label>
                {users.map(user => (
                  <label key={user._id} className="flex items-center space-x-2 mb-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleUserSelection(user._id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{user.name} ({user.role})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {analyticsData && (
        <>
          {/* Tentative Report Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daily Sales & Margin Update
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const reportText = generateTentativeReportText(analyticsData.tentativeReport);
                    navigator.clipboard.writeText(reportText);
                    alert('Report copied to clipboard!');
                  }}
                  className="ml-auto flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Copy Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg font-mono text-sm whitespace-pre-line">
                {generateTentativeReportText(analyticsData.tentativeReport)}
              </div>
            </CardContent>
          </Card>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-2xl font-bold">{analyticsData.summary.totalLeads}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">${analyticsData.summary.totalRevenue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Lead Value</p>
                    <p className="text-2xl font-bold">${analyticsData.summary.averageLeadValue}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.summary.conversionRate.toFixed(1)}%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Lead Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry:any) => {
                        const total = analyticsData.statusDistribution.reduce((sum, item) => sum + item.value, 0);
                        const percent = total > 0 ? (entry.value / total) * 100 : 0;
                        return `${entry.name} ${percent.toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" name="Leads" />
                    <Line type="monotone" dataKey="sales" stroke="#82ca9d" name="Sales" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Agent Performance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Agent Performance (All Status)
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tableData = analyticsData.agentPerformance.map(agent => ({
                      'Agent Name': agent.agentName,
                      'Total Leads': agent.totalLeads,
                      'Follow-ups': agent.followups,
                      'Sale Payment Done': agent.salePaymentDone,
                      'Engines': agent.engines,
                      'Transmissions': agent.transmissions,
                      'Parts': agent.parts,
                      'Total Pitched Product Price': agent.totalPitchedProductPrice,
                      'Total Product Amount': agent.totalProductPrice,
                      'Tentative Margin': agent.tentativeMargin
                    }));
                    downloadTableAsExcel(tableData, 'agent_performance_all_status');
                  }}
                  className="ml-auto flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Agent</th>
                      <th className="text-left p-2">Total Leads</th>
                      <th className="text-left p-2">Follow-ups</th>
                      <th className="text-left p-2">Sale Payment Done</th>
                      <th className="text-left p-2">Engines</th>
                      <th className="text-left p-2">Transmissions</th>
                      <th className="text-left p-2">Parts</th>
                      <th className="text-left p-2">Total Pitched Price</th>
                      <th className="text-left p-2">Total Product Amount</th>
                      <th className="text-left p-2">Tentative Margin</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.agentPerformance.map((agent, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{agent.agentName}</td>
                        <td className="p-2">{agent.totalLeads}</td>
                        <td className="p-2">{agent.followups}</td>
                        <td className="p-2">{agent.salePaymentDone}</td>
                        <td className="p-2">{agent.engines}</td>
                        <td className="p-2">{agent.transmissions}</td>
                        <td className="p-2">{agent.parts}</td>
                        <td className="p-2 font-semibold">${agent.totalPitchedProductPrice}</td>
                        <td className="p-2">${agent.totalProductPrice}</td>
                        <td className="p-2">
                          <Badge className={agent.tentativeMargin >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            ${agent.tentativeMargin}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadUserReport(agent.agentName)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    {(() => {
                      const totals = calculateColumnTotals(analyticsData.agentPerformance, [
                        'totalLeads', 'followups', 'salePaymentDone', 'engines', 'transmissions', 'parts',
                        'totalPitchedProductPrice', 'totalProductPrice', 'tentativeMargin'
                      ]);
                      return (
                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                          <td className="p-2">TOTAL</td>
                          <td className="p-2">{totals.totalLeads}</td>
                          <td className="p-2">{totals.followups}</td>
                          <td className="p-2">{totals.salePaymentDone}</td>
                          <td className="p-2">{totals.engines}</td>
                          <td className="p-2">{totals.transmissions}</td>
                          <td className="p-2">{totals.parts}</td>
                          <td className="p-2">${totals.totalPitchedProductPrice}</td>
                          <td className="p-2">${totals.totalProductPrice}</td>
                          <td className="p-2">
                            <Badge className={totals.tentativeMargin >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              ${totals.tentativeMargin}
                            </Badge>
                          </td>
                          <td className="p-2">-</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Agent Performance - Product Purchased */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Agent Performance (Product Purchased Only)
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tableData = analyticsData.agentPerformanceProductPurchased.map(agent => ({
                      'Agent Name': agent.agentName,
                      'Total Leads': agent.totalLeads,
                      'Converted': agent.converted,
                      'Engines': agent.engines,
                      'Transmissions': agent.transmissions,
                      'Parts': agent.parts,
                      'Total Sales Price': agent.totalSalesPrice,
                      'Total Cost Price': agent.totalCostPrice,
                      'Total Margin Tentative': agent.totalMarginTentative
                    }));
                    downloadTableAsExcel(tableData, 'agent_performance_product_purchased');
                  }}
                  className="ml-auto flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Agent</th>
                      <th className="text-left p-2">Total Leads</th>
                      <th className="text-left p-2">Converted</th>
                      <th className="text-left p-2">Engines</th>
                      <th className="text-left p-2">Transmissions</th>
                      <th className="text-left p-2">Parts</th>
                      <th className="text-left p-2">Total Sales Price</th>
                      <th className="text-left p-2">Total Cost Price</th>
                      <th className="text-left p-2">Total Margin Tentative</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.agentPerformanceProductPurchased.map((agent, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{agent.agentName}</td>
                        <td className="p-2">{agent.totalLeads}</td>
                        <td className="p-2">{agent.converted}</td>
                        <td className="p-2">{agent.engines}</td>
                        <td className="p-2">{agent.transmissions}</td>
                        <td className="p-2">{agent.parts}</td>
                        <td className="p-2 font-semibold">${agent.totalSalesPrice}</td>
                        <td className="p-2">${agent.totalCostPrice}</td>
                        <td className="p-2">
                          <Badge className={agent.totalMarginTentative >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            ${agent.totalMarginTentative}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadUserReport(agent.agentName)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Report
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    {(() => {
                      const totals = calculateColumnTotals(analyticsData.agentPerformanceProductPurchased, [
                        'totalLeads', 'converted', 'engines', 'transmissions', 'parts', 
                        'totalSalesPrice', 'totalCostPrice', 'totalMarginTentative'
                      ]);
                      return (
                        <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                          <td className="p-2">TOTAL</td>
                          <td className="p-2">{totals.totalLeads}</td>
                          <td className="p-2">{totals.converted}</td>
                          <td className="p-2">{totals.engines}</td>
                          <td className="p-2">{totals.transmissions}</td>
                          <td className="p-2">{totals.parts}</td>
                          <td className="p-2">${totals.totalSalesPrice}</td>
                          <td className="p-2">${totals.totalCostPrice}</td>
                          <td className="p-2">
                            <Badge className={totals.totalMarginTentative >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              ${totals.totalMarginTentative}
                            </Badge>
                          </td>
                          <td className="p-2">-</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Whole Team Performance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Whole Team Performance
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const teamData = [analyticsData.teamPerformance];
                    downloadTableAsExcel(teamData, 'team_performance');
                  }}
                  className="ml-auto flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.teamPerformance.totalLeads}
                  </div>
                  <div className="text-sm text-blue-600">Total Leads</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.teamPerformance.converted}
                  </div>
                  <div className="text-sm text-green-600">Converted</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analyticsData.teamPerformance.followups}
                  </div>
                  <div className="text-sm text-purple-600">Follow-ups</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analyticsData.teamPerformance.salesPaymentDone}
                  </div>
                  <div className="text-sm text-orange-600">Sales Payment Done</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    ${analyticsData.teamPerformance.totalSalesPrice}
                  </div>
                  <div className="text-sm text-indigo-600">Total Sales Price</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">
                    ${analyticsData.teamPerformance.totalCostPrice}
                  </div>
                  <div className="text-sm text-pink-600">Total Cost Price</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${analyticsData.teamPerformance.totalMarginTentative}
                  </div>
                  <div className="text-sm text-emerald-600">Total Margin Tentative</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Payment Methods Distribution
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTableAsExcel(analyticsData.paymentMethods, 'payment_methods')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.paymentMethods}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="method" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Product Types Revenue
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTableAsExcel(analyticsData.productTypes, 'product_types')}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analyticsData.productTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* State Distribution Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                State Distribution
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTableAsExcel(analyticsData.stateDistribution, 'state_distribution')}
                  className="ml-auto flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">State</th>
                      <th className="text-left p-2">Lead Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.stateDistribution.map((state, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{state.state}</td>
                        <td className="p-2">{state.count}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td className="p-2">TOTAL</td>
                      <td className="p-2">
                        {analyticsData.stateDistribution.reduce((sum, state) => sum + state.count, 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  function generateTentativeReportText(report: any): string {
    const today = new Date();
    const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const todayFormatted = today.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    const deficitTillDate = report.targetAsOfToday - report.marginAchievedTillDate;
    const targetDay = deficitTillDate;
    const balanceAfterToday = targetDay - report.todayAchieved;
    const deficitAfterTentative = deficitTillDate - report.tentativeMargin;
    const reductionPercentage = deficitTillDate > 0 ? Math.round((report.tentativeMargin / deficitTillDate) * 100) : 0;

    return `Daily Sales & Margin Update

Target (${currentMonth}): $${report.monthlyTarget}
Target /Day: $${report.dailyTarget}
Target as on ${todayFormatted}: $${report.targetAsOfToday}

Margin Achieved Till Date: $${report.marginAchievedTillDate}
Deficit Till Date: $${deficitTillDate}
 
Day ${todayFormatted}

Calls: ${report.todayCalls} | Engines: ${report.todayEngines} | Parts: ${report.todayParts}

Target Day: $${targetDay} 
Achieved: $${report.todayAchieved}
Balance: $${balanceAfterToday}

Tentative Sales (Follow-ups): ${report.tentativeFollowups}
Total Sales: $${report.tentativeSales} | 
Tentative Margin: $${report.tentativeMargin}
Deficit After Tentative Margin: $${deficitAfterTentative} (↓${reductionPercentage}%)`;
  }
  async function handleDownloadUserReport(agentName: string) {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        agentName,
        format: 'excel'
      });

      const response = await fetch(`/api/analytics/user-report?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${agentName.replace(/\s+/g, '_')}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('User report download failed:', error);
    }
  }
}