# CMS Auto Parts - System Flow Chart

## Authentication Flow
```
User Access → Login/Register → JWT Token Generation → Role-based Dashboard
```

## Module Access Control
```
Admin Role:
├── Full CRUD on all modules
├── User Management
├── Activity History Access
├── Import/Export (All modules)
└── Delete Operations (All modules)

Manager Role:
├── CRUD (No Delete) on business modules
├── User Management (Limited)
├── Import/Export (All business modules)
├── Access to own + assigned agents' data
└── No Activity History access

Agent Role:
├── CRUD (No Delete) on leads, orders, payments
├── No Import/Export capabilities
├── Access to own data only
└── No User/Activity History access
```

## Lead Management Flow
```
Lead Creation → Status Tracking → Payment Processing → Sale Generation → Target Update

Status Flow:
New → Connected → Nurturing → Waiting for respond → Customer Waiting for respond 
→ Payment Under Process → Customer making payment → Sale Payment Done → Sale Closed
```

## Vendor Order Flow
```
Order Creation → Customer Assignment → Multi-stage Processing → Delivery Tracking

Stage Flow:
Stage 1 (Engine Pull) → Stage 2 (Washing) → Stage 3 (Testing) 
→ Stage 4 (Pack & Ready) → Stage 5 (Shipping) → Stage 6 (Delivered)
```

## Sales Management Flow
```
Lead Status: "Sale Payment Done" → Auto-create Sale Record → Sales Workflow

Sales Workflow:
1. Send Order Confirmation Email → Mark as Sent
2. Track Order Stage → Update Status
3. Order Delivered → Send Delivery Confirmation
4. Complete Sale Process
```

## Payment Processing Flow
```
Payment Creation → Validation → Processing → Dispute Management → Resolution

Payment Status Flow:
Pending → Completed/Failed → Refunded/Disputed → Resolved
```

## Target Management Flow
```
Target Creation → User Assignment → Progress Tracking → Achievement Calculation

Auto-Update Trigger:
Lead Status: "Sale Closed" → Extract Total Margin → Update Assigned User's Target
```

## Activity Tracking Flow
```
All User Actions → Activity Logger → Database Storage → Admin Dashboard

Tracked Actions:
- Create, Read, Update, Delete operations
- Login/Logout events
- Import/Export operations
- Registration events
```

## File Upload Flow
```
File Selection → Validation (Type + Size) → Server Upload → Database Record → File Management
```

## Import/Export Flow
```
Import: File Upload → Validation → Data Processing → Database Update → Activity Log
Export: Data Query → Format Conversion (Excel/CSV) → File Download → Activity Log
```

## Email Integration Flow
```
Sales Trigger → Email Template Generation → SMTP Send → Status Update → Activity Log

Email Types:
- Order Confirmation (Sale Payment Done status)
- Delivery Confirmation (Stage 6 - Delivered)
```

## Data Relationships
```
Users ←→ Leads (assignedAgent, createdBy)
Users ←→ VendorOrders (createdBy, updatedBy)
Users ←→ Targets (assignedUsers)
Users ←→ ActivityHistory (userId)
Leads → Sales (leadId - auto-generated)
Leads → PaymentRecords (leadId - connected)
VendorOrders ←→ Leads (orderNo connection)
```

## Security Implementation
```
JWT Authentication → Role Verification → Permission Check → Data Filter → Operation Execute
```

## Database Collections Structure
```
MongoDB Collections:
├── users (Authentication & Role Management)
├── leads (Lead Management with History)
├── vendor_orders (Order Processing)
├── targets (Target Management)
├── sales (Sales Workflow)
├── payment_records (Payment Processing)
├── activity_history (System Audit Trail)
└── file_uploads (Document Management)
```

## API Endpoint Structure
```
/api/auth/* - Authentication endpoints
/api/leads/* - Lead management
/api/vendor-orders/* - Order management  
/api/targets/* - Target management
/api/sales/* - Sales management
/api/payment-records/* - Payment management
/api/users/* - User management (Admin/Manager)
/api/activity/* - Activity history (Admin only)
/api/import/* - Data import (Manager/Admin)
/api/export/* - Data export (Manager/Admin)
```