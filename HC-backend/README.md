# 🏥 HealthLocker — Secure Digital Health Record System

> Production-ready backend API for managing digital health records with role-based access control, time-limited permissions, and comprehensive audit logging.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Folder Structure](#-folder-structure)
- [Setup Instructions](#-setup-instructions)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [User Roles](#-user-roles)
- [Security Architecture](#-security-architecture)
- [Error Handling](#-error-handling)
- [Postman Testing Guide](#-postman-testing-guide)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime environment |
| **Express.js** | REST API framework |
| **MongoDB + Mongoose** | Database & ODM |
| **Firebase Admin SDK** | Authentication (token verification) |
| **JWT** | Backend session tokens |
| **AWS S3 (SDK v3)** | Private file storage |
| **Multer** | Multipart file handling |
| **Helmet** | HTTP security headers |
| **express-rate-limit** | Rate limiting |
| **express-mongo-sanitize** | NoSQL injection prevention |

---

## 🏛️ Architecture

Clean **MVC (Model-View-Controller)** architecture:

```
Request → Middleware (Auth/Validation) → Controller → Service → Model → Response
```

Every action is logged via the **Audit Service** for full traceability.

---

## 📁 Folder Structure

```
HC-backend/
├── config/
│   ├── aws.js                   # AWS S3 client configuration
│   ├── db.js                    # MongoDB connection with retry
│   └── firebase.js              # Firebase Admin SDK initialization
│
├── models/
│   ├── User.js                  # Users (patient/doctor/admin)
│   ├── Visit.js                 # Medical visit records
│   ├── File.js                  # Uploaded files (S3 metadata)
│   ├── AccessPermission.js      # Time-limited doctor access grants
│   └── AuditLog.js              # Immutable audit trail
│
├── controllers/
│   ├── authController.js        # Login, profile management
│   ├── visitController.js       # Visit CRUD & doctor access
│   ├── fileController.js        # File upload/download/delete
│   ├── accessController.js      # Grant/revoke permissions
│   ├── adminController.js       # Doctor verification, user management
│   └── auditController.js       # Audit log queries
│
├── routes/
│   ├── authRoutes.js
│   ├── visitRoutes.js
│   ├── fileRoutes.js
│   ├── accessRoutes.js
│   ├── adminRoutes.js
│   └── logRoutes.js
│
├── middleware/
│   ├── verifyFirebaseToken.js   # Firebase ID token verification
│   ├── verifyJWT.js             # JWT verification
│   ├── roleMiddleware.js        # Role-based access control
│   ├── errorHandler.js          # Global error handler
│   └── upload.js                # Multer file upload config
│
├── services/
│   ├── auditService.js          # Audit log creation
│   └── s3Service.js             # S3 upload/download/delete
│
├── utils/
│   ├── AppError.js              # Custom error classes
│   ├── catchAsync.js            # Async error wrapper
│   ├── jwt.js                   # JWT generation & verification
│   └── response.js              # Standardized API responses
│
├── app.js                       # Express app configuration
├── server.js                    # Server entry point
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB** running locally or a cloud instance (MongoDB Atlas)
- **Firebase project** with Authentication enabled
- **AWS account** with an S3 bucket configured

### Step 1: Clone & Install

```bash
cd d:\Projects\HC\HC-backend
npm install
```

### Step 2: Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your actual values
```

### Step 3: Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Save the downloaded JSON as `config/firebase-service-account.json`
4. Ensure `FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json` in `.env`

### Step 4: AWS S3 Bucket

1. Create a **private** S3 bucket in AWS Console
2. Create an IAM user with S3 permissions
3. Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `AWS_S3_BUCKET_NAME` in `.env`

**Recommended S3 Bucket Policy** (private access only via signed URLs):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyPublicAccess",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::healthlocker-files/*",
      "Condition": {
        "StringNotEquals": {
          "aws:PrincipalAccount": "YOUR_AWS_ACCOUNT_ID"
        }
      }
    }
  ]
}
```

### Step 5: Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

You should see:
```
✅ MongoDB Connected: localhost
✅ Firebase Admin SDK initialized with service account.

═══════════════════════════════════════════
  🏥 HealthLocker API Server
  Secure Digital Health Record System
═══════════════════════════════════════════
  🌍 Environment : development
  🚀 Port        : 5000
  📡 API Base    : http://localhost:5000/api
  ❤️  Health      : http://localhost:5000/api/health
═══════════════════════════════════════════
```

---

## 🔐 Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/healthlocker` |
| `JWT_SECRET` | Secret key for JWT signing | `my_super_secret_key_123` |
| `JWT_EXPIRES_IN` | JWT token expiry | `7d` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./config/firebase-service-account.json` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJal...` |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `AWS_S3_BUCKET_NAME` | S3 bucket name | `healthlocker-files` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `MAX_FILE_SIZE_MB` | Max upload file size | `10` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS (true for port 465) | `false` |
| `SMTP_USER` | SMTP username / email | `you@gmail.com` |
| `SMTP_PASS` | SMTP password / app password | `your_app_password` |
| `EMAIL_FROM_NAME` | Display name in sent emails | `HealthLocker` |
| `FRONTEND_URL` | Base URL for verification links | `http://localhost:5173` |

---

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new patient account | None |
| `POST` | `/api/auth/login` | Login with email + password | None |
| `GET` | `/api/auth/verify-email?token=...` | Verify email address | None |
| `GET` | `/api/auth/me` | Get current user profile | JWT |

### Visits (Patient)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/visits` | Create a visit | JWT (Patient) |
| `GET` | `/api/visits` | List my visits | JWT (Patient) |
| `GET` | `/api/visits/:id` | Get visit details | JWT (Owner/Doctor) |

### Visits (Doctor)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/visits/patient/:patientId` | View patient visits | JWT (Doctor) |
| `PUT` | `/api/visits/:id/notes` | Add visit notes | JWT (Doctor) |

### Files

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/files/upload` | Upload medical record | JWT (Patient) |
| `POST` | `/api/files/upload-prescription` | Upload prescription | JWT (Doctor) |
| `GET` | `/api/files/visit/:visitId` | List visit files | JWT (Owner/Doctor) |
| `GET` | `/api/files/:id/download` | Get download URL | JWT (Owner/Doctor) |
| `DELETE` | `/api/files/:id` | Delete file (10 min window) | JWT (Patient) |

### Access Permissions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/access/grant` | Grant doctor access | JWT (Patient) |
| `DELETE` | `/api/access/revoke` | Revoke doctor access | JWT (Patient) |
| `GET` | `/api/access/my-permissions` | List my permissions | JWT (Patient) |
| `GET` | `/api/access/doctor-permissions` | Doctor's active permissions | JWT (Doctor) |

### Admin

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `PUT` | `/api/admin/verify-doctor` | Verify/reject a doctor | JWT (Admin) |
| `PUT` | `/api/admin/suspend-user` | Suspend/unsuspend user | JWT (Admin) |
| `GET` | `/api/admin/logs` | System audit logs | JWT (Admin) |
| `GET` | `/api/admin/users` | List all users | JWT (Admin) |
| `GET` | `/api/admin/stats` | Dashboard statistics | JWT (Admin) |

### Audit Logs

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/logs/my-logs` | My audit logs | JWT |
| `GET` | `/api/logs/access-logs` | Who accessed my data | JWT |

### System

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | None |

---

## 👥 User Roles

### 🧑‍⚕️ Patient
- Upload medical records & files
- Create visit entries
- Grant time-limited doctor access
- Revoke access anytime
- View audit logs of own data
- Download files
- Delete wrongly uploaded files (within **10 minutes**)

### 👨‍⚕️ Doctor
- View patient records **only if permission is valid** (not expired, not revoked)
- Upload prescriptions for specific visits
- Add visit notes
- **Cannot** edit or delete old records
- Can upload corrected prescriptions (old ones marked as "Replaced")

### 🛡️ Admin
- Verify doctors (medical license approval)
- Suspend/unsuspend users
- View system-wide audit logs
- Monitor suspicious activity (unauthorized access attempts)
- View dashboard statistics
- **Cannot** edit medical data

---

## 🔒 Security Architecture

### 1. Dual Authentication Layer
```
Firebase ID Token → Backend verifies → MongoDB user lookup → JWT issued
                                                              ↓
                                    All subsequent API calls use JWT
```

### 2. Role-Based Access Control (RBAC)
- Every route is protected by `verifyJWT` + `roleMiddleware`
- Unauthorized access attempts are logged to audit trail

### 3. Time-Based Permission Validation
- Doctor access is granted for a configurable duration (default: 24 hours)
- System checks `expiresAt` and `isRevoked` on every access attempt
- Patients can revoke access **at any time**

### 4. Data Protection
- **AWS S3 private bucket** — no public URLs
- **Pre-signed URLs** — time-limited download links (15 min)
- **AES-256 server-side encryption** on all S3 objects
- **NoSQL injection prevention** via `express-mongo-sanitize`
- **HTTP Parameter Pollution protection** via `hpp`

### 5. Comprehensive Audit Trail
Every action is logged with:
- User ID, role, and action type
- Target resource ID and model
- IP address and User-Agent
- Timestamp
- Additional metadata

### 6. Rate Limiting
- 100 requests per 15 minutes per IP (configurable)
- Prevents brute force and abuse

### 7. Security Headers
- Helmet.js sets all recommended HTTP security headers
- CSP, HSTS, X-Content-Type-Options, etc.

---

## ❌ Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE"
}
```

### Error Codes Reference

| errorCode | HTTP Status | Description |
|---|---|---|
| `NO_TOKEN` | 401 | No auth token provided |
| `INVALID_FIREBASE_TOKEN` | 401 | Firebase token invalid/expired |
| `INVALID_TOKEN` | 401 | JWT invalid |
| `TOKEN_EXPIRED` | 401 | JWT expired |
| `ACCOUNT_SUSPENDED` | 401 | User account suspended |
| `INSUFFICIENT_ROLE` | 403 | Role not authorized |
| `ACCESS_DENIED` | 403 | Permission denied |
| `PERMISSION_EXPIRED_OR_REVOKED` | 403 | Doctor permission invalid |
| `DOCTOR_NOT_VERIFIED` | 403 | Doctor not yet verified |
| `DELETE_WINDOW_EXPIRED` | 403 | 10-minute deletion window passed |
| `NOT_FOUND` | 404 | Resource not found |
| `DUPLICATE_KEY` | 409 | Duplicate entry |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `UNSUPPORTED_FILE_TYPE` | 400 | File type not allowed |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 🧪 Postman Testing Guide

### Prerequisites

- Server running on `http://localhost:5000`
- Firebase project with test users created
- Firebase ID token (obtain from frontend or Firebase REST API)

---

### STEP 1: Health Check

```
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "HealthLocker API is running",
  "timestamp": "2026-02-21T18:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

---

### STEP 2: Login with Firebase Token

```
POST http://localhost:5000/api/auth/login
```

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "isNewUser": true,
    "user": {
      "id": "65a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "patient",
      "isVerified": false,
      "profilePicture": null
    }
  }
}
```

> **📌 Copy the `token` value — use it as `Bearer <JWT_TOKEN>` for all subsequent requests.**

**Expected Failure (No Token):**
```json
{
  "success": false,
  "message": "No authentication token provided",
  "errorCode": "NO_TOKEN"
}
```

---

### STEP 3: Create a Visit

```
POST http://localhost:5000/api/visits
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "visitDate": "2026-02-21",
  "title": "Annual Health Checkup",
  "notes": "Blood pressure normal, recommended vitamin D supplement",
  "hospitalName": "City General Hospital",
  "visitType": "checkup"
}
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Visit created successfully",
  "data": {
    "visit": {
      "_id": "65a1b2c3d4e5f6789012346",
      "patientId": "65a1b2c3d4e5f6789012345",
      "visitDate": "2026-02-21T00:00:00.000Z",
      "title": "Annual Health Checkup",
      "notes": "Blood pressure normal, recommended vitamin D supplement",
      "hospitalName": "City General Hospital",
      "visitType": "checkup",
      "createdAt": "2026-02-21T18:00:00.000Z"
    }
  }
}
```

---

### STEP 4: Upload a File

```
POST http://localhost:5000/api/files/upload
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body (form-data):**
| Key | Value |
|---|---|
| `file` | Select a PDF or image file |
| `visitId` | `65a1b2c3d4e5f6789012346` |
| `category` | `report` |

**Expected Success:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "file": {
      "_id": "65a1b2c3d4e5f6789012347",
      "visitId": "65a1b2c3d4e5f6789012346",
      "fileName": "blood_report.pdf",
      "fileType": "application/pdf",
      "fileSize": 245760,
      "category": "report",
      "isReplaced": false,
      "isDeleted": false
    }
  }
}
```

**Expected Failure (Wrong MIME type):**
```json
{
  "success": false,
  "message": "File type 'application/zip' is not allowed...",
  "errorCode": "UNSUPPORTED_FILE_TYPE"
}
```

---

### STEP 5: Grant Doctor Access

> First, you need a doctor user. Create another Firebase user, log in via the `/api/auth/login` endpoint, then update their role to `doctor` directly in MongoDB, and have the admin verify them.

```
POST http://localhost:5000/api/access/grant
```

**Headers:**
```
Authorization: Bearer <PATIENT_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "doctorId": "65a1b2c3d4e5f6789012348",
  "visitId": "65a1b2c3d4e5f6789012346",
  "durationHours": 48
}
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Access granted successfully",
  "data": {
    "permission": {
      "id": "65a1b2c3d4e5f6789012349",
      "doctorId": "65a1b2c3d4e5f6789012348",
      "visitId": "65a1b2c3d4e5f6789012346",
      "grantedAt": "2026-02-21T18:00:00.000Z",
      "expiresAt": "2026-02-23T18:00:00.000Z"
    }
  }
}
```

**Expected Failure (Unverified Doctor):**
```json
{
  "success": false,
  "message": "Cannot grant access to an unverified doctor",
  "errorCode": "DOCTOR_NOT_VERIFIED"
}
```

---

### STEP 6: Doctor Views Patient Visit

```
GET http://localhost:5000/api/visits/patient/65a1b2c3d4e5f6789012345
```

**Headers:**
```
Authorization: Bearer <DOCTOR_JWT_TOKEN>
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Patient visits retrieved successfully",
  "data": {
    "visits": [
      {
        "_id": "65a1b2c3d4e5f6789012346",
        "title": "Annual Health Checkup",
        "visitDate": "2026-02-21T00:00:00.000Z",
        "notes": "Blood pressure normal...",
        "doctorId": null
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1, "pages": 1 }
  }
}
```

**Expected Failure (No Permission):**
```json
{
  "success": false,
  "message": "You do not have valid permission to access this patient's records",
  "errorCode": "PERMISSION_EXPIRED_OR_REVOKED"
}
```

---

### STEP 7: Admin Verifies Doctor

```
PUT http://localhost:5000/api/admin/verify-doctor
```

**Headers:**
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "doctorId": "65a1b2c3d4e5f6789012348",
  "approved": true
}
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Doctor verified successfully",
  "data": {
    "doctor": {
      "id": "65a1b2c3d4e5f6789012348",
      "name": "Dr. Smith",
      "email": "smith@hospital.com",
      "isVerified": true
    }
  }
}
```

---

### STEP 8: Revoke Doctor Access

```
DELETE http://localhost:5000/api/access/revoke
```

**Headers:**
```
Authorization: Bearer <PATIENT_JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "permissionId": "65a1b2c3d4e5f6789012349"
}
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Access revoked successfully"
}
```

---

### STEP 9: View My Audit Logs

```
GET http://localhost:5000/api/logs/my-logs?page=1&limit=10
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "data": {
    "logs": [
      {
        "action": "FILE_UPLOADED",
        "description": "File uploaded: blood_report.pdf",
        "ipAddress": "127.0.0.1",
        "createdAt": "2026-02-21T18:00:00.000Z"
      },
      {
        "action": "VISIT_CREATED",
        "description": "Visit created: Annual Health Checkup",
        "createdAt": "2026-02-21T17:59:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 2, "pages": 1 }
  }
}
```

---

### STEP 10: Download File (Signed URL)

```
GET http://localhost:5000/api/files/65a1b2c3d4e5f6789012347/download
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Expected Success:**
```json
{
  "success": true,
  "message": "Download URL generated",
  "data": {
    "downloadUrl": "https://healthlocker-files.s3.ap-south-1.amazonaws.com/...",
    "file": { ... }
  }
}
```

> The `downloadUrl` is a **signed URL valid for 15 minutes**. Open it in a browser to download.

---

### Postman Tips

1. **Create a Postman Environment** with variables:
   - `BASE_URL` = `http://localhost:5000`
   - `FIREBASE_TOKEN` = your Firebase ID token
   - `JWT_TOKEN` = the JWT returned from login
   - `PATIENT_ID` = your patient user ID

2. **Auto-set JWT**: In the login request's **Tests** tab, add:
   ```javascript
   var response = pm.response.json();
   if (response.success) {
     pm.environment.set("JWT_TOKEN", response.data.token);
   }
   ```

3. **Use environment variables** in headers:
   ```
   Authorization: Bearer {{JWT_TOKEN}}
   ```

---

## 📜 License

ISC

---

**Built with ❤️ by HealthLocker Team**
