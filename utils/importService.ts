import * as XLSX from 'xlsx';
import {
  validateData,
  leadSchema,
  vendorOrderSchema,
  paymentRecordSchema,
} from './validation';

export class ImportService {
  static async processExcelFile(
    buffer: Buffer,
    sheetName?: string
  ): Promise<any[]> {
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  }

  static async processCSVFile(csvContent: string): Promise<any[]> {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map((v) => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  }

  static validateLeadData(data: any[]): { valid: any[]; invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    data.forEach((item, index) => {
      const mappedData = this.mapLeadFields(item);
      const validation = validateData(leadSchema, mappedData);

      if (validation.success) {
        valid.push({ ...mappedData, rowNumber: index + 2 });
      } else {
        invalid.push({
          data: item,
          errors: validation.errors,
          rowNumber: index + 2,
        });
      }
    });

    return { valid, invalid };
  }

  static validateVendorOrderData(data: any[]): {
    valid: any[];
    invalid: any[];
  } {
    const valid: any[] = [];
    const invalid: any[] = [];

    data.forEach((item, index) => {
      const mappedData = this.mapVendorOrderFields(item);
      const validation = validateData(vendorOrderSchema, mappedData);

      if (validation.success) {
        valid.push({ ...mappedData, rowNumber: index + 2 });
      } else {
        invalid.push({
          data: item,
          errors: validation.errors,
          rowNumber: index + 2,
        });
      }
    });

    return { valid, invalid };
  }

  static validatePaymentData(data: any[]): { valid: any[]; invalid: any[] } {
    const valid: any[] = [];
    const invalid: any[] = [];

    data.forEach((item, index) => {
      const mappedData = this.mapPaymentFields(item);
      const validation = validateData(paymentRecordSchema, mappedData);

      if (validation.success) {
        valid.push({ ...mappedData, rowNumber: index + 2 });
      } else {
        invalid.push({
          data: item,
          errors: validation.errors,
          rowNumber: index + 2,
        });
      }
    });

    return { valid, invalid };
  }

  private static mapLeadFields(data: any): any {
    return {
      customerName: data['Customer Name'] || data.customerName || '',
      phoneNumber: data['Phone Number'] || data.phoneNumber || '',
      customerEmail: data['Email'] || data.customerEmail || '',
      alternateNumber: data['Alternate Number'] || data.alternateNumber || '',
      productName: data['Product Name'] || data.productName || '',
      productAmount: this.parseNumber(
        data['Product Price'] || data.productAmount
      ),
      pitchedProductPrice: this.parseNumber(
        data['Pitched Product Price'] || data.pitchedProductPrice
      ),
      quantity: this.parseNumber(data['Quantity'] || data.quantity),
      status: data['Status'] || data.status || 'New',
    };
  }

  private static mapVendorOrderFields(data: any): any {
    return {
      shopName: data['Shop/Vendor Name'] || data.shopName || data.vendorName || '',
      vendorAddress: data['Vendor Address'] || data.vendorAddress || data.vendorLocation || '',
      orderNo: data['Order Number'] || data.orderNo || '',
      customerName: data['Customer Name'] || data.customerName || '',
      productName: data['Product Name'] || data.productName || '',
      orderStatus:
        data['Order Status'] || data.orderStatus || 'stage1 (engine pull)',
    };
  }

  private static mapPaymentFields(data: any): any {
    return {
      customerName: data['Customer Name'] || data.customerName || '',
      modeOfPayment: data['Mode of Payment'] || data.modeOfPayment || '',
      salesPrice: this.parseNumber(data['Sales Price'] || data.salesPrice),
      paymentDate:
        data['Payment Date'] || data.paymentDate || new Date().toISOString(),
    };
  }

  private static parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }
}
