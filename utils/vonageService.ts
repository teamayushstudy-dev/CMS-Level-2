import { Vonage } from '@vonage/server-sdk';

interface VonageConfig {
  apiKey: string;
  apiSecret: string;
  applicationId: string;
  privateKey: string;
}

interface CallOptions {
  to: string;
  from: string;
  answerUrl: string;
  eventUrl?: string;
  recordingUrl?: string;
  machineDetection?: 'continue' | 'hangup';
  lengthTimer?: number;
  ringingTimer?: number;
}

interface CallResponse {
  uuid: string;
  status: string;
  direction: string;
  conversationUuid: string;
}

export class VonageService {
  private vonage: Vonage;
  private config: VonageConfig;

  constructor() {
    this.config = {
      apiKey: process.env.VONAGE_API_KEY || '',
      apiSecret: process.env.VONAGE_API_SECRET || '',
      applicationId: process.env.VONAGE_APPLICATION_ID || '',
      privateKey: process.env.VONAGE_PRIVATE_KEY || ''
    };

    this.vonage = new Vonage({
      apiKey: this.config.apiKey,
      apiSecret: this.config.apiSecret,
      applicationId: this.config.applicationId,
      privateKey: this.config.privateKey
    });
  }

  async makeCall(options: CallOptions): Promise<CallResponse> {
    try {
      const response = await this.vonage.voice.createOutboundCall({
        to: [{ type: 'phone', number: options.to }],
        from: { type: 'phone', number: options.from },
        answer_url: [options.answerUrl],
        event_url: options.eventUrl ? [options.eventUrl] : undefined,
        machine_detection: options.machineDetection || 'continue',
        length_timer: options.lengthTimer || 7200,
        ringing_timer: options.ringingTimer || 60
      });

      return {
        uuid: response.uuid,
        status: response.status,
        direction: response.direction,
        conversationUuid: response.conversation_uuid
      };
    } catch (error) {
      console.error('Vonage call error:', error);
      throw new Error('Failed to initiate call');
    }
  }

  async hangupCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.hangupCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage hangup error:', error);
      return false;
    }
  }

  async transferCall(callUuid: string, destination: string): Promise<boolean> {
    try {
      await this.vonage.voice.transferCall(callUuid, {
        action: 'transfer',
        destination: {
          type: 'phone',
          number: destination
        }
      });
      return true;
    } catch (error) {
      console.error('Vonage transfer error:', error);
      return false;
    }
  }

  async muteCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.muteCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage mute error:', error);
      return false;
    }
  }

  async unmuteCall(callUuid: string): Promise<boolean> {
    try {
      await this.vonage.voice.unmuteCall(callUuid);
      return true;
    } catch (error) {
      console.error('Vonage unmute error:', error);
      return false;
    }
  }

  async getCallDetails(callUuid: string): Promise<any> {
    try {
      const response = await this.vonage.voice.getCall(callUuid);
      return response;
    } catch (error) {
      console.error('Vonage get call details error:', error);
      throw new Error('Failed to get call details');
    }
  }

  async getCallRecording(recordingUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(recordingUrl, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch recording');
      }
      
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('Vonage get recording error:', error);
      throw new Error('Failed to get call recording');
    }
  }

  generateNCCO(options: {
    recordCall?: boolean;
    recordingEventUrl?: string;
    connectTo?: string;
    message?: string;
  }) {
    const ncco: any[] = [];

    if (options.message) {
      ncco.push({
        action: 'talk',
        text: options.message,
        voiceName: 'Amy'
      });
    }

    if (options.recordCall) {
      ncco.push({
        action: 'record',
        eventUrl: options.recordingEventUrl ? [options.recordingEventUrl] : undefined,
        split: 'conversation',
        channels: 1,
        format: 'mp3',
        endOnSilence: 3,
        endOnKey: '#',
        timeOut: 7200,
        beepStart: true
      });
    }

    if (options.connectTo) {
      ncco.push({
        action: 'connect',
        from: process.env.VONAGE_PHONE_NUMBER,
        endpoint: [{
          type: 'phone',
          number: options.connectTo
        }]
      });
    }

    return ncco;
  }
}

export default VonageService;