'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  RotateCcw,
  Users,
  Settings
} from 'lucide-react';

interface CallControlsProps {
  isCallActive: boolean;
  isMuted: boolean;
  isRecording: boolean;
  callDuration: number;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleRecording: () => void;
  onTransfer?: () => void;
  onHold?: () => void;
  disabled?: boolean;
}

export default function CallControls({
  isCallActive,
  isMuted,
  isRecording,
  callDuration,
  onEndCall,
  onToggleMute,
  onToggleRecording,
  onTransfer,
  onHold,
  disabled = false
}: CallControlsProps) {
  const [volume, setVolume] = useState(50);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCallActive) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            Call Active - {formatDuration(callDuration)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Mute/Unmute */}
          <Button
            variant={isMuted ? "destructive" : "outline"}
            onClick={onToggleMute}
            disabled={disabled}
            className="h-12 flex flex-col items-center justify-center"
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            <span className="text-xs mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </Button>

          {/* Recording */}
          <Button
            variant={isRecording ? "destructive" : "outline"}
            onClick={onToggleRecording}
            disabled={disabled}
            className="h-12 flex flex-col items-center justify-center"
          >
            <RotateCcw className="h-5 w-5" />
            <span className="text-xs mt-1">{isRecording ? 'Stop Rec' : 'Record'}</span>
          </Button>

          {/* Transfer */}
          {onTransfer && (
            <Button
              variant="outline"
              onClick={onTransfer}
              disabled={disabled}
              className="h-12 flex flex-col items-center justify-center"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1">Transfer</span>
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="outline"
            disabled={disabled}
            className="h-12 flex flex-col items-center justify-center"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs mt-1">Settings</span>
          </Button>
        </div>

        {/* Volume Control */}
        <div className="mt-4 flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-gray-500" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="flex-1"
            disabled={disabled}
          />
          <span className="text-sm text-gray-500 w-8">{volume}%</span>
        </div>

        {/* End Call Button */}
        <Button
          onClick={onEndCall}
          disabled={disabled}
          className="w-full mt-4 h-12 bg-red-600 hover:bg-red-700 text-white"
        >
          <PhoneOff className="h-5 w-5 mr-2" />
          End Call
        </Button>
      </CardContent>
    </Card>
  );
}