import { z } from 'zod';

export const userRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name too long'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'manager', 'agent']),
  assignedTo: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const billingInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullAddress: z.string().optional(),
  addressType: z.enum(['residential', 'commercial']).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
});

export const shippingInfoSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  fullAddress: z.string().optional(),
  addressType: z.enum(['residential', 'commercial']).optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
});

export const productSchema = z.object({
  productId: z.string().optional(),
  productType: z.enum(['engine', 'transmission', 'part']),
  productName: z.string().min(1, 'Product name is required'),
  productAmount: z.number().optional(),
  pitchedProductPrice: z.number().optional(),
  quantity: z.number().optional(),
  yearOfMfg: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  engineSize: z.string().optional(),
  partType: z.enum(['used', 'new']).optional(),
  partNumber: z.string().optional(),
  vin: z.string().optional(),
  vendorInfo: z
    .object({
      shopName: z.string().optional(),
      address: z.string().optional(),
      modeOfPayment: z.string().optional(),
      dateOfBooking: z.string().optional(),
      dateOfDelivery: z.string().optional(),
      trackingNumber: z.string().optional(),
      shippingCompany: z.string().optional(),
      proofOfDelivery: z.string().optional(),
    })
    .optional(),
});

export const leadSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  description: z.string().optional(),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  customerEmail: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  alternateNumber: z.string().optional(),
  status: z.string().optional(),
  assignedAgent: z.string().optional(),
  sameShippingInfo: z.boolean().optional(),
  billingInfo: billingInfoSchema.optional(),
  shippingInfo: shippingInfoSchema.optional(),
  // Legacy address fields
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  mechanicName: z.string().optional(),
  contactPhone: z.string().optional(),
  state: z.string().optional(),
  zone: z.string().optional(),
  callType: z.string().optional(),
  // Payment fields
  modeOfPayment: z.string().optional(),
  paymentPortal: z
    .enum(['EasyPayDirect', 'Authorize.net'])
    .optional()
    .or(z.literal('')),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  paymentDate: z.string().optional(),
  salesPrice: z.number().optional(),
  pendingBalance: z.number().optional(),
  costPrice: z.number().optional(),
  refunded: z.number().optional(),
  disputeCategory: z.string().optional(),
  disputeReason: z.string().optional(),
  disputeDate: z.string().optional(),
  disputeResult: z.string().optional(),
  refundDate: z.string().optional(),
  refundTAT: z.string().optional(),
  arn: z.string().optional(),
  refundCredited: z.number().optional(),
  chargebackAmount: z.number().optional(),
  products: z.array(productSchema).optional(),
});

export const noteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(1000, 'Note too long'),
});

export const followupScheduleSchema = z.object({
  followupType: z.enum([
    'Follow up',
    'Desision Follow up',
    'Payment Follow up',
  ]),
  followupDate: z.string().optional(),
  followupTime: z.string().optional(),
  notes: z.string().optional(),
});

export const vendorOrderSchema = z.object({
  shopName: z.string().min(1, 'Shop name is required'),
  vendorAddress: z.string().min(1, 'Vendor address is required'),
  orderNo: z.string().optional(),
  orderStatus: z
    .enum([
      'stage1 (engine pull)',
      'stage2 (washing)',
      'stage3 (testing)',
      'stage4 (pack & ready)',
      'stage5 (shipping)',
      'stage6 (delivered)',
    ])
    .optional(),
  customerName: z.string().optional(),
  productType: z.enum(['engine', 'transmission', 'part']).optional(),
  productName: z.string().optional(),
  productAmount: z.number().optional(),
  quantity: z.number().optional(),
  yearOfMfg: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  trim: z.string().optional(),
  engineSize: z.string().optional(),
  partType: z.enum(['used', 'new']).optional(),
  partNumber: z.string().optional(),
  vin: z.string().optional(),
  itemSubtotal: z.number().optional(),
  shippingHandling: z.number().optional(),
  taxCollected: z.number().optional(),
  courierCompany: z.string().optional(),
  trackingId: z.string().optional(),
  shippingAddress: z.string().optional(),
  modeOfPayment: z.string().optional(),
  dateOfBooking: z.string().optional(),
  dateOfDelivery: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCompany: z.string().optional(),
  proofOfDelivery: z.string().optional(),
});

export const targetSchema = z.object({
  title: z.string().min(1, 'Target title is required'),
  targetAmount: z.number().positive('Target amount must be positive'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  assignedUsers: z.array(z.string()).optional(),
});

export const paymentRecordSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  modeOfPayment: z.string().min(1, 'Payment mode is required'),
  salesPrice: z.number().positive('Sales price must be positive'),
  paymentDate: z.string().or(z.date()),
  paymentPortal: z
    .enum(['EasyPayDirect', 'Authorize.net'])
    .optional()
    .or(z.literal('')),
  cardNumber: z.string().optional(),
  expiry: z.string().optional(),
  pendingBalance: z.number().optional(),
  costPrice: z.number().optional(),
  refunded: z.number().optional(),
  disputeCategory: z.string().optional(),
  disputeReason: z.string().optional(),
  disputeDate: z.string().optional(),
  disputeResult: z.string().optional(),
  refundDate: z.string().optional(),
  refundTAT: z.string().optional(),
  arn: z.string().optional(),
  refundCredited: z.number().optional(),
  chargebackAmount: z.number().optional(),
  paymentStatus: z
    .enum(['pending', 'completed', 'failed', 'refunded', 'disputed'])
    .optional(),
});

export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}