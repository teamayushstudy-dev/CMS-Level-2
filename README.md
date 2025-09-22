# CMS for Used Auto Parts

## Project Overview
A comprehensive Content Management System for Used Auto Parts business with role-based access control, lead management, vendor operations, and sales tracking.

## Tech Stack
- **Frontend**: Next.js 13+ with App Router
- **Backend**: Next.js API Routes (Serverless)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with role-based access control
- **File Upload**: Custom file upload system
- **Email Integration**: SMTP integration for order confirmations

## System Architecture

### User Roles
1. **Admin**: Full system access - CRUD operations on all modules
2. **Manager**: Add, view, edit, update (no delete) - access to own and assigned agents' data
3. **Agent**: Limited access to leads, vendor orders, payment records - own data only

### Core Modules
1. **Authentication System**
2. **Lead Management**
3. **Vendor Order Management** 
4. **Target Management**
5. **Sales Management**
6. **Payment Record Management**
7. **User Management**
8. **Activity History**
9. **Import/Export System**

## Database Schema

### Collections
- users
- leads
- vendor_orders
- targets
- sales
- payment_records
- activity_history
- file_uploads

## Key Features
- Role-based dashboard
- Activity tracking for all operations
- Import/Export functionality
- Email integration for order confirmations
- Multi-stage order processing
- Automated target tracking
- Comprehensive payment dispute management

## Installation
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Environment Variables Required
- MONGODB_URI
- JWT_SECRET
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- NEXT_PUBLIC_API_URL