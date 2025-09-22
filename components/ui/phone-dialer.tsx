'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Backpack as Backspace } from 'lucide-react';

interface PhoneDialerProps {
  phoneNumber: string;
  onPhoneNumberChange: (number: string) => void;
  onCall: () => void;
  disabled?: boolean;
}

export default function PhoneDialer({ 
  phoneNumber, 
  onPhoneNumberChange, 
  onCall, 
  disabled = false 
}: PhoneDialerProps) {
  const dialpadNumbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const handleNumberClick = (number: string) => {
    if (disabled) return;
    onPhoneNumberChange(phoneNumber + number);
  };

  const handleBackspace = () => {
    if (disabled) return;
    onPhoneNumberChange(phoneNumber.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onPhoneNumberChange('');
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Phone Dialer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Display */}
        <div className="text-center">
          <Input
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            placeholder="Enter phone number"
            className="text-center text-lg font-mono"
            disabled={disabled}
          />
        </div>

        {/* Dialpad */}
        <div className="grid grid-cols-3 gap-2">
          {dialpadNumbers.flat().map((number) => (
            <Button
              key={number}
              variant="outline"
              className="h-12 text-lg font-semibold"
              onClick={() => handleNumberClick(number)}
              disabled={disabled}
            >
              {number}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleBackspace}
            disabled={disabled || !phoneNumber}
          >
            <Backspace className="h-4 w-4" />
          </Button>
          
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={onCall}
            disabled={disabled || !phoneNumber.trim()}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClear}
            disabled={disabled || !phoneNumber}
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}