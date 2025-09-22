import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';

export class ExportService {
  static async exportToExcel(data: any[], filename: string): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  static async exportToCSV(data: any[], fields: string[]): Promise<string> {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  static formatLeadData(leads: any[]): any[] {
    return leads.map((lead) => ({
      'Lead ID': lead.leadId,
      'Lead Number': lead.leadNumber,
      Date: new Date(lead.date).toLocaleDateString(),
      'Customer Name': lead.customerName,
      'Description': lead.description || '',
      'Phone Number': lead.phoneNumber,
      'Alternate Number': lead.alternateNumber || '',
      Email: lead.customerEmail,
      Status: lead.status,
      'Product Name': lead.products?.[0]?.productName || '',
      'Product Price': lead.products?.[0]?.productAmount || 0,
      'Pitched Product Price': lead.products?.[0]?.pitchedProductPrice || 0,
      'Sales Price': lead.salesPrice || 0,
      'Cost Price': lead.costPrice || 0,
      'Total Margin': lead.totalMargin || 0,
      'Mode of Payment': lead.modeOfPayment || '',
      'Payment Portal': lead.paymentPortal || '',
      'Billing State': lead.billingInfo?.state || '',
      'Shipping State': lead.shippingInfo?.state || '',
      'Assigned Agent': lead.assignedAgent?.name || '',
      'Created Date': new Date(lead.createdAt).toLocaleDateString(),
    }));
  }

  static formatVendorOrderData(orders: any[]): any[] {
    return orders.map((order) => ({
      'Order Number': order.orderNo,
      Date: new Date(order.date).toLocaleDateString(),
      'Shop/Vendor Name': order.shopName,
      'Vendor Address': order.vendorAddress,
      'Customer Name': order.customerName || '',
      'Customer Phone': order.customerPhone || '',
      'Alternate Number': order.alternateNumber || '',
      'Customer Email': order.customerEmail || '',
      'Order Status': order.orderStatus,
      'Grand Total': order.grandTotal || 0,
      'Product Name': order.productName || '',
      'Product Price': order.productAmount || 0,
      'Pitched Product Price': order.pitchedProductPrice || 0,
      'Tracking ID': order.trackingId || '',
      'Tracking Number': order.trackingNumber || '',
      'Shipping Company': order.shippingCompany || '',
      'Created Date': new Date(order.createdAt).toLocaleDateString(),
    }));
  }

  static formatPaymentData(payments: any[]): any[] {
    return payments.map((payment) => ({
      'Payment ID': payment.paymentId,
      'Customer Name': payment.customerName,
      'Customer Phone': payment.customerPhone || '',
      'Alternate Number': payment.alternateNumber || '',
      'Customer Email': payment.customerEmail || '',
      'Payment Date': new Date(payment.paymentDate).toLocaleDateString(),
      'Sales Price': payment.salesPrice,
      'Cost Price': payment.costPrice || 0,
      'Mode of Payment': payment.modeOfPayment,
      'Payment Portal': payment.paymentPortal || '',
      'Payment Status': payment.paymentStatus,
      'Total Margin': payment.totalMargin || 0,
      'Pending Balance': payment.pendingBalance || 0,
      Refunded: payment.refunded || 0,
      'Refund Credited': payment.refundCredited || 0,
      'Chargeback Amount': payment.chargebackAmount || 0,
      'Dispute Category': payment.disputeCategory || '',
      'ARN': payment.arn || '',
      'Created Date': new Date(payment.createdAt).toLocaleDateString(),
    }));
  }

  static formatSalesData(sales: any[]): any[] {
    return sales.map((sale) => ({
      'Sale ID': sale.saleId,
      'Customer Name': sale.customerName,
      'Customer Email': sale.customerEmail,
      'Phone Number': sale.phoneNumber,
      'Alternate Number': sale.alternateNumber || '',
      'Product Name': sale.productName || '',
      'Sales Price': sale.salesPrice || 0,
      'Cost Price': sale.costPrice || 0,
      'Total Margin': sale.totalMargin || 0,
      'Mode of Payment': sale.modeOfPayment || '',
      'Payment Portal': sale.paymentPortal || '',
      'Payment Date': sale.paymentDate ? new Date(sale.paymentDate).toLocaleDateString() : '',
      Status: sale.status,
      'Order Confirmation Sent': sale.orderConfirmationSent ? 'Yes' : 'No',
      'Delivery Confirmation Sent': sale.deliveryConfirmationSent
        ? 'Yes'
        : 'No',
      'Assigned Agent': sale.assignedAgent?.name || '',
      'Created Date': new Date(sale.createdAt).toLocaleDateString(),
    }));
  }
}
