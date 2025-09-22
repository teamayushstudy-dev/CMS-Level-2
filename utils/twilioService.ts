import twilio from 'twilio';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface SMSOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
  statusCallback?: string;
  maxPrice?: string;
  provideFeedback?: boolean;
}

interface SMSResponse {
  sid: string;
  status: string;
  direction: string;
  from: string;
  to: string;
  body: string;
  numSegments: string;
  price?: string;
  priceUnit?: string;
  errorCode?: string;
  errorMessage?: string;
}

export class TwilioService {
  private client: twilio.Twilio;
  private config: TwilioConfig;

  constructor() {
    this.config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '+18337153810'
    };

    this.client = twilio(this.config.accountSid, this.config.authToken);
  }

  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    try {
      const message = await this.client.messages.create({
        body: options.body,
        from: this.config.phoneNumber,
        to: options.to,
        mediaUrl: options.mediaUrl,
        statusCallback: options.statusCallback,
        maxPrice: options.maxPrice,
        provideFeedback: options.provideFeedback
      });

      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        numSegments: message.numSegments,
        price: message.price,
        priceUnit: message.priceUnit,
        errorCode: message.errorCode?.toString(),
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      console.error('Twilio SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async getSMSStatus(messageSid: string): Promise<any> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return {
        sid: message.sid,
        status: message.status,
        direction: message.direction,
        from: message.from,
        to: message.to,
        body: message.body,
        numSegments: message.numSegments,
        price: message.price,
        priceUnit: message.priceUnit,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error: any) {
      console.error('Twilio get SMS status error:', error);
      throw new Error(`Failed to get SMS status: ${error.message}`);
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const account = await this.client.api.accounts(this.config.accountSid).fetch();
      return {
        sid: account.sid,
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated,
        dateUpdated: account.dateUpdated
      };
    } catch (error: any) {
      console.error('Twilio account info error:', error);
      throw new Error(`Failed to get account info: ${error.message}`);
    }
  }

  async getPhoneNumbers(): Promise<any[]> {
    try {
      const phoneNumbers = await this.client.incomingPhoneNumbers.list();
      return phoneNumbers.map(number => ({
        sid: number.sid,
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        capabilities: number.capabilities,
        voiceUrl: number.voiceUrl,
        smsUrl: number.smsUrl,
        statusCallback: number.statusCallback
      }));
    } catch (error: any) {
      console.error('Twilio get phone numbers error:', error);
      throw new Error(`Failed to get phone numbers: ${error.message}`);
    }
  }

  async validatePhoneNumber(phoneNumber: string): Promise<any> {
    try {
      const lookup = await this.client.lookups.v1.phoneNumbers(phoneNumber).fetch();
      return {
        phoneNumber: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat,
        valid: true
      };
    } catch (error: any) {
      console.error('Twilio phone validation error:', error);
      return {
        phoneNumber,
        valid: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    
    return phoneNumber;
  }
}

export default TwilioService;