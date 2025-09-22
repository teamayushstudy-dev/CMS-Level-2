import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/dbConfig';
import Lead from '@/models/Lead';
import Sale from '@/models/Sale';
import Target from '@/models/Target';
import Followup from '@/models/Followup';
import { verifyToken, extractTokenFromRequest } from '@/middleware/auth';
import { PermissionManager } from '@/middleware/permissions';
import { validateData, leadSchema } from '@/utils/validation';
import { generateSaleId, generateFollowupId } from '@/utils/idGenerator';
import { logActivity, getChangeDescription } from '@/utils/activityLogger';

// Import missing function
function generateVendorId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `VND${timestamp.slice(-6)}${random}`;
}

function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ORD${timestamp.slice(-6)}${random}`;
}

function generateProductId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `PROD${timestamp.slice(-6)}${random}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canRead('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const lead = await Lead.findById(params.id)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .populate('history.performedBy', 'name')
      .populate('notes.createdBy', 'name email');

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canUpdate('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body = await request.json();
    const oldValues = lead.toObject();

    // Handle status change to follow-up types - Create Follow-up Record
    const followupStatuses = ['Follow up', 'Desision Follow up', 'Payment Follow up'];
    if (followupStatuses.includes(body.status) && !followupStatuses.includes(lead.status)) {
      // Create followup record without validation
      const followupData = {
        followupId: generateFollowupId(),
        leadId: lead._id,
        leadNumber: lead.leadNumber,
        customerName: lead.customerName,
        customerEmail: lead.customerEmail || '',
        phoneNumber: lead.phoneNumber,
        productName: lead.products?.[0]?.productName || '',
        salesPrice: lead.salesPrice || body.salesPrice,
        status: body.status,
        assignedAgent: lead.assignedAgent,
        dateCreated: new Date(),
        scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
        scheduledTime: body.scheduledTime || '',
        isDone: false,
        notes: body.followupNotes ? [body.followupNotes] : [],
        createdBy: user.id,
        updatedBy: user.id
      };

      const followup = new Followup(followupData);
      await followup.save();

      // Add to lead's scheduled followups
      if (body.scheduledDate && body.scheduledTime) {
        lead.scheduledFollowups.push({
          followupType: body.status,
          scheduledDate: new Date(`${body.scheduledDate}T${body.scheduledTime}`),
          scheduledTime: body.scheduledTime,
          notes: body.followupNotes || '',
          isCompleted: false,
          createdBy: user.id,
          createdAt: new Date()
        });
      }
    }

    // Handle status change to "Sale Payment Done" - Create Sale Record
    if (body.status === 'Sale Payment Done' && lead.status !== 'Sale Payment Done') {
      const sale = new Sale({
        leadId: lead._id,
        saleId: generateSaleId(),
        customerName: lead.customerName,
        customerEmail: lead.customerEmail || '',
        phoneNumber: lead.phoneNumber,
        alternateNumber: lead.alternateNumber,
        productName: lead.products?.[0]?.productName,
        salesPrice: body.salesPrice || lead.salesPrice,
        costPrice: body.costPrice || lead.costPrice,
        totalMargin: (body.salesPrice || lead.salesPrice || 0) - (body.costPrice || lead.costPrice || 0),
        modeOfPayment: body.modeOfPayment || lead.modeOfPayment,
        paymentPortal: body.paymentPortal || lead.paymentPortal,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : lead.paymentDate,
        assignedAgent: lead.assignedAgent,
        createdBy: user.id,
        updatedBy: user.id,
      });
      await sale.save();
    }
    // Handle payment record creation/update if payment information is provided
    if (body.salesPrice && body.salesPrice > 0) {
      const PaymentRecord = (await import('@/models/PaymentRecord')).default;

      // Check if payment record already exists for this lead
      let existingPayment = await PaymentRecord.findOne({ leadId: lead._id });

      if (existingPayment) {
        // Update existing payment record
        Object.assign(existingPayment, {
          customerPhone: body.phoneNumber || lead.phoneNumber,
          alternateNumber: body.alternateNumber || lead.alternateNumber,
          customerPhone: lead.phoneNumber,
          customerEmail: lead.customerEmail,
          modeOfPayment: body.modeOfPayment || existingPayment.modeOfPayment,
          paymentPortal: body.paymentPortal,
          cardNumber: body.cardNumber,
          expiry: body.expiry,
          paymentDate: body.paymentDate
            ? new Date(body.paymentDate)
            : existingPayment.paymentDate,
          salesPrice: body.salesPrice,
          pendingBalance: body.pendingBalance,
          costPrice: body.costPrice,
          refunded: body.refunded,
          disputeCategory: body.disputeCategory,
          disputeReason: body.disputeReason,
          disputeDate: body.disputeDate
            ? new Date(body.disputeDate)
            : existingPayment.disputeDate,
          disputeResult: body.disputeResult,
          refundDate: body.refundDate
            ? new Date(body.refundDate)
            : existingPayment.refundDate,
          refundTAT: body.refundTAT,
          arn: body.arn,
          refundCredited: body.refundCredited,
          chargebackAmount: body.chargebackAmount,
          // Copy vendor payment info if available
          vendorPaymentMode: body.products?.[0]?.vendorInfo?.modeOfPayment,
          vendorPaymentAmount: body.products?.[0]?.vendorInfo?.paymentAmount,
          vendorPaymentDate: body.products?.[0]?.vendorInfo?.dateOfBooking ? new Date(body.products[0].vendorInfo.dateOfBooking) : undefined,
          vendorName: body.products?.[0]?.vendorInfo?.shopName,
          vendorAddress: body.products?.[0]?.vendorInfo?.address,
          updatedBy: user.id,
        });
        await existingPayment.save();
      } else {
        // Create new payment record
        const { generatePaymentId } = await import('@/utils/idGenerator');
        const paymentData = {
          paymentId: generatePaymentId(),
          leadId: lead._id,
          customerName: lead.customerName,
          customerPhone: body.phoneNumber || lead.phoneNumber,
          alternateNumber: body.alternateNumber || lead.alternateNumber,
          customerPhone: lead.phoneNumber,
          customerEmail: lead.customerEmail,
          modeOfPayment: body.modeOfPayment || 'Not specified',
          paymentPortal: body.paymentPortal,
          cardNumber: body.cardNumber,
          expiry: body.expiry,
          paymentDate: body.paymentDate
            ? new Date(body.paymentDate)
            : new Date(),
          salesPrice: body.salesPrice,
          pendingBalance: body.pendingBalance,
          costPrice: body.costPrice,
          refunded: body.refunded,
          disputeCategory: body.disputeCategory,
          disputeReason: body.disputeReason,
          disputeDate: body.disputeDate
            ? new Date(body.disputeDate)
            : undefined,
          disputeResult: body.disputeResult,
          refundDate: body.refundDate ? new Date(body.refundDate) : undefined,
          refundTAT: body.refundTAT,
          arn: body.arn,
          refundCredited: body.refundCredited,
          chargebackAmount: body.chargebackAmount,
          // Copy vendor payment info if available
          vendorPaymentMode: body.products?.[0]?.vendorInfo?.modeOfPayment,
          vendorPaymentAmount: body.products?.[0]?.vendorInfo?.paymentAmount,
          vendorPaymentDate: body.products?.[0]?.vendorInfo?.dateOfBooking ? new Date(body.products[0].vendorInfo.dateOfBooking) : undefined,
          vendorName: body.products?.[0]?.vendorInfo?.shopName,
          vendorAddress: body.products?.[0]?.vendorInfo?.address,
          paymentStatus: 'pending',
          createdBy: user.id,
          updatedBy: user.id,
        };

        const payment = new PaymentRecord(paymentData);
        await payment.save();
      }
    }

    // Handle vendor order creation/update for products with vendor information
    if (body.products) {
      const VendorOrder = (await import('@/models/VendorOrder')).default;

      for (const product of body.products) {
        if (
          product.vendorInfo &&
          (product.vendorInfo.shopName || product.vendorInfo.address)
        ) {
          // Check if vendor order already exists for this product
          let existingOrder = await VendorOrder.findOne({
            customerId: lead._id.toString(),
            productName: product.productName,
          });

          if (existingOrder) {
            // Update existing vendor order
            Object.assign(existingOrder, {
              shopName: product.vendorInfo.shopName || existingOrder.shopName,
              vendorAddress: product.vendorInfo.address || existingOrder.vendorAddress,
              customerName: body.customerName || lead.customerName,
              customerPhone: lead.phoneNumber,
              alternateNumber: body.alternateNumber || lead.alternateNumber,
              customerEmail: lead.customerEmail,
              productName: product.productName,
              pitchedProductPrice: product.pitchedProductPrice,
              productAmount: product.productAmount,
              quantity: product.quantity,
              yearOfMfg: product.yearOfMfg,
              make: product.make,
              model: product.model,
              trim: product.trim,
              engineSize: product.engineSize,
              partType: product.partType,
              partNumber: product.partNumber,
              vin: product.vin,
              modeOfPayment: product.vendorInfo.modeOfPayment,
              vendorPaymentMode: product.vendorInfo.modeOfPayment,
              vendorPaymentAmount: product.vendorInfo.paymentAmount,
              vendorContactPerson: product.vendorInfo.contactPerson,
              vendorPhone: product.vendorInfo.phone,
              vendorEmail: product.vendorInfo.email,
              dateOfBooking: product.vendorInfo.dateOfBooking,
              dateOfDelivery: product.vendorInfo.dateOfDelivery,
              trackingNumber: product.vendorInfo.trackingNumber,
              shippingCompany: product.vendorInfo.shippingCompany,
              proofOfDelivery: product.vendorInfo.proofOfDelivery,
              updatedBy: user.id,
            });
            await existingOrder.save();
          } else {
            // Create new vendor order
            const vendorOrderData = {
              vendorId: generateVendorId(),
              shopName: product.vendorInfo.shopName || 'Not specified',
              vendorAddress: product.vendorInfo.address || 'Not specified',
              orderNo: generateOrderNumber(),
              customerId: lead._id.toString(),
              customerName: lead.customerName,
              customerPhone: lead.phoneNumber,
              alternateNumber: body.alternateNumber || lead.alternateNumber,
              customerEmail: lead.customerEmail,
              orderStatus: 'stage1 (engine pull)',
              productType: product.productType,
              productName: product.productName,
              pitchedProductPrice: product.pitchedProductPrice,
              productAmount: product.productAmount,
              quantity: product.quantity,
              yearOfMfg: product.yearOfMfg,
              make: product.make,
              model: product.model,
              trim: product.trim,
              engineSize: product.engineSize,
              partType: product.partType,
              partNumber: product.partNumber,
              vin: product.vin,
              modeOfPayment: product.vendorInfo.modeOfPayment,
              vendorPaymentMode: product.vendorInfo.modeOfPayment,
              vendorPaymentAmount: product.vendorInfo.paymentAmount,
              vendorContactPerson: product.vendorInfo.contactPerson,
              vendorPhone: product.vendorInfo.phone,
              vendorEmail: product.vendorInfo.email,
              dateOfBooking: product.vendorInfo.dateOfBooking,
              dateOfDelivery: product.vendorInfo.dateOfDelivery,
              trackingNumber: product.vendorInfo.trackingNumber,
              shippingCompany: product.vendorInfo.shippingCompany,
              proofOfDelivery: product.vendorInfo.proofOfDelivery,
              shippingAddress: lead.shippingInfo?.fullAddress || lead.billingInfo?.fullAddress,
              createdBy: user.id,
              updatedBy: user.id,
            };

            const vendorOrder = new VendorOrder(vendorOrderData);
            await vendorOrder.save();

            // Update lead with order number if not already set
            if (!lead.orderNo) {
              lead.orderNo = vendorOrder.orderNo;
              await lead.save();
            }
          }
        }
      }
    }


    // Handle status change to "Product Purchased" - Update Target Achievement
    if (body.status === 'Product Purchased' && lead.status !== 'Product Purchased') {
      // Update target achievement
      const finalMargin = (body.salesPrice || lead.salesPrice || 0) - (body.costPrice || lead.costPrice || 0);
      if (finalMargin > 0) {
        await Target.updateMany(
          {
            assignedUsers: lead.assignedAgent,
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
          },
          { $inc: { achievedAmount: finalMargin } }
        );
      }
    }

    // Update lead
    Object.assign(lead, body);
    lead.updatedBy = user.id;

    // Add history entry
    lead.history.push({
      action: 'updated',
      changes: body,
      performedBy: user.id,
      timestamp: new Date(),
      notes:
        body.status !== oldValues.status
          ? `Status changed from ${oldValues.status} to ${body.status}`
          : 'Lead updated',
    });

    await lead.save();

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'update',
      module: 'leads',
      description: getChangeDescription('update', 'leads', lead.customerName),
      targetId: lead._id.toString(),
      targetType: 'Lead',
      changes: { oldValues, newValues: body },
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    const updatedLead = await Lead.findById(lead._id)
      .populate('assignedAgent', 'name email')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    return NextResponse.json({
      message: 'Lead updated successfully',
      lead: updatedLead,
    });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const permissions = new PermissionManager(user);
    if (!permissions.canDelete('leads')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const lead = await Lead.findById(params.id);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await Lead.findByIdAndDelete(params.id);

    // Log activity
    await logActivity({
      userId: user.id,
      userName: user.email,
      userRole: user.role,
      action: 'delete',
      module: 'leads',
      description: getChangeDescription('delete', 'leads', lead.customerName),
      targetId: lead._id.toString(),
      targetType: 'Lead',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
