import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendOrderConfirmation(to: string, orderDetails: any): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: 'Order Confirmation - Used Auto Parts',
        html: this.getOrderConfirmationTemplate(orderDetails),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendDeliveryConfirmation(
    to: string,
    orderDetails: any
  ): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: 'Order Delivered - Used Auto Parts',
        html: this.getDeliveryConfirmationTemplate(orderDetails),
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private getOrderConfirmationTemplate(orderDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background-color: white; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${orderDetails.customerName},</p>
            <p>Thank you for your order! We have received your order and are processing it.</p>
            
            <div class="order-details">
              <h3>Order Details:</h3>
              <p><strong>Order Number:</strong> ${
                orderDetails.orderNo || 'N/A'
              }</p>
              <p><strong>Product:</strong> ${
                orderDetails.productName || 'N/A'
              }</p>
              <p><strong>Amount:</strong> $${orderDetails.salesPrice || 0}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>We will keep you updated on the status of your order.</p>
            <p>If you have any questions, please contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Used Auto Parts CMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getDeliveryConfirmationTemplate(orderDetails: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Delivered</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .order-details { background-color: white; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Delivered!</h1>
          </div>
          <div class="content">
            <p>Dear ${orderDetails.customerName},</p>
            <p>Great news! Your order has been delivered successfully.</p>
            
            <div class="order-details">
              <h3>Delivery Details:</h3>
              <p><strong>Order Number:</strong> ${
                orderDetails.orderNo || 'N/A'
              }</p>
              <p><strong>Product:</strong> ${
                orderDetails.productName || 'N/A'
              }</p>
              <p><strong>Tracking Number:</strong> ${
                orderDetails.trackingNumber || 'N/A'
              }</p>
              <p><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p>Thank you for choosing us for your auto parts needs!</p>
            <p>If you have any questions or concerns about your order, please contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 Used Auto Parts CMS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default EmailService;
