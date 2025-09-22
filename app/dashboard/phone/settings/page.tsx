'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, TestTube, Phone, MessageSquare, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneSettings {
  vonageApiKey: string;
  vonageApiSecret: string;
  vonageApplicationId: string;
  vonagePhoneNumber: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  autoRecordCalls: boolean;
  callQualityThreshold: string;
  smsAutoReply: boolean;
  smsAutoReplyMessage: string;
}

export default function PhoneSettingsPage() {
  const [settings, setSettings] = useState<PhoneSettings>({
    vonageApiKey: '',
    vonageApiSecret: '',
    vonageApplicationId: '',
    vonagePhoneNumber: '',
    twilioAccountSid: '',
    twilioAuthToken: '',
    twilioPhoneNumber: '+18337153810',
    autoRecordCalls: true,
    callQualityThreshold: 'good',
    smsAutoReply: false,
    smsAutoReplyMessage: 'Thank you for your message. We will respond shortly.'
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    vonage: 'unknown' | 'connected' | 'error';
    twilio: 'unknown' | 'connected' | 'error';
  }>({
    vonage: 'unknown',
    twilio: 'unknown'
  });
  const router = useRouter();

  useEffect(() => {
    loadSettings();
    testConnections();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const testConnections = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      
      // Test Vonage connection
      try {
        const vonageResponse = await fetch('/api/phone/test-vonage', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setConnectionStatus(prev => ({
          ...prev,
          vonage: vonageResponse.ok ? 'connected' : 'error'
        }));
      } catch {
        setConnectionStatus(prev => ({ ...prev, vonage: 'error' }));
      }

      // Test Twilio connection
      try {
        const twilioResponse = await fetch('/api/phone/test-twilio', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setConnectionStatus(prev => ({
          ...prev,
          twilio: twilioResponse.ok ? 'connected' : 'error'
        }));
      } catch {
        setConnectionStatus(prev => ({ ...prev, twilio: 'error' }));
      }
    } catch (error) {
      console.error('Error testing connections:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/phone/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        testConnections();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/phone')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Phone System
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Phone System Settings</h1>
          <p className="text-gray-600">Configure Vonage and Twilio integration settings</p>
        </div>

        {/* Connection Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Connection Status
              <Button
                variant="outline"
                size="sm"
                onClick={testConnections}
                disabled={testing}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testing ? 'Testing...' : 'Test Connections'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Vonage (Voice Calls)</p>
                    <p className="text-sm text-gray-500">Voice calling service</p>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.vonage)}
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Twilio (SMS)</p>
                    <p className="text-sm text-gray-500">SMS messaging service</p>
                  </div>
                </div>
                {getStatusBadge(connectionStatus.twilio)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Vonage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Vonage Configuration (Voice Calls)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vonageApiKey">API Key</Label>
                  <Input
                    id="vonageApiKey"
                    name="vonageApiKey"
                    value={settings.vonageApiKey}
                    onChange={handleChange}
                    placeholder="Your Vonage API Key"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vonageApiSecret">API Secret</Label>
                  <Input
                    id="vonageApiSecret"
                    name="vonageApiSecret"
                    type="password"
                    value={settings.vonageApiSecret}
                    onChange={handleChange}
                    placeholder="Your Vonage API Secret"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vonageApplicationId">Application ID</Label>
                  <Input
                    id="vonageApplicationId"
                    name="vonageApplicationId"
                    value={settings.vonageApplicationId}
                    onChange={handleChange}
                    placeholder="Your Vonage Application ID"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="vonagePhoneNumber">Phone Number</Label>
                  <Input
                    id="vonagePhoneNumber"
                    name="vonagePhoneNumber"
                    value={settings.vonagePhoneNumber}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Twilio Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Twilio Configuration (SMS)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="twilioAccountSid">Account SID</Label>
                  <Input
                    id="twilioAccountSid"
                    name="twilioAccountSid"
                    value={settings.twilioAccountSid}
                    onChange={handleChange}
                    placeholder="Your Twilio Account SID"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="twilioAuthToken">Auth Token</Label>
                  <Input
                    id="twilioAuthToken"
                    name="twilioAuthToken"
                    type="password"
                    value={settings.twilioAuthToken}
                    onChange={handleChange}
                    placeholder="Your Twilio Auth Token"
                    className="mt-1"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                  <Input
                    id="twilioPhoneNumber"
                    name="twilioPhoneNumber"
                    value={settings.twilioPhoneNumber}
                    onChange={handleChange}
                    placeholder="+18337153810"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your Twilio phone number (default: +18337153810)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Call Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoRecordCalls"
                    name="autoRecordCalls"
                    checked={settings.autoRecordCalls}
                    onChange={handleChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="autoRecordCalls">Auto-record all calls</Label>
                </div>
                
                <div>
                  <Label htmlFor="callQualityThreshold">Call Quality Threshold</Label>
                  <select
                    id="callQualityThreshold"
                    name="callQualityThreshold"
                    value={settings.callQualityThreshold}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMS Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SMS Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="smsAutoReply"
                  name="smsAutoReply"
                  checked={settings.smsAutoReply}
                  onChange={handleChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="smsAutoReply">Enable auto-reply for incoming SMS</Label>
              </div>
              
              {settings.smsAutoReply && (
                <div>
                  <Label htmlFor="smsAutoReplyMessage">Auto-reply Message</Label>
                  <textarea
                    id="smsAutoReplyMessage"
                    name="smsAutoReplyMessage"
                    value={settings.smsAutoReplyMessage}
                    onChange={handleChange}
                    rows={3}
                    maxLength={160}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.smsAutoReplyMessage.length}/160 characters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}