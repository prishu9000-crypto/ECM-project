# Event Cloud Manager — Installation & Setup Guide

## 1. Prerequisites
- **Node.js**: Version 18.0.0 or higher (Node 20+ recommended)
- **NPM**: Version 9.0.0 or higher
- **Firebase CLI** (optional for cloud deploy): `npm install -g firebase-tools`

## 2. Quick Local Run
```bash
# 1. Navigate to the project root
cd event-cloud-manager

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser. The application runs immediately in **Academic Demonstration Mode** with sample events and 1-click test roles.

## 3. Connecting to Real Google Cloud Firebase

### Step 1: Create a Firebase Project
1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it `event-cloud-manager`, and create.

### Step 2: Enable Firebase Authentication
1. In the Firebase console left menu, navigate to **Build &rarr; Authentication**.
2. Click **Get Started**, choose **Email/Password**, and toggle **Enable**.

### Step 3: Create Cloud Firestore Database
1. Navigate to **Build &rarr; Firestore Database**.
2. Click **Create database**, choose your geographical location, and select **Start in production mode**.

### Step 4: Configure Web App Credentials
1. In Project Overview, click the **Web icon (`</>`)** to add a web application.
2. Copy the Firebase configuration keys and update your `.env` file:
```env
VITE_FIREBASE_API_KEY=AIzaSyYourRealKeyHere
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_USE_FIREBASE_EMULATOR=false
VITE_COLLEGE_NAME="Apex Institute of Technology"
VITE_COLLEGE_EMAIL_DOMAIN="apex.edu.in"
VITE_QR_TOKEN_EXPIRY_SECONDS=60
```
3. Restart Vite (`npm run dev`). The banner at the top will switch to **Cloud Backend Connected**!

## 4. Deploying Firestore Security Rules and Indexes
```bash
firebase login
firebase use --add your-project-id
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Bootstrapping the Initial Administrator
To securely create the very first administrator account without exposing public role assignment:
```bash
# Call the bootstrapFirstAdmin Cloud Function with your setup token
firebase functions:shell
> bootstrapFirstAdmin({ email: "admin@apex.edu.in", password: "AdminStrongPassword!", fullName: "System Administrator", setupToken: "INIT_ADMIN_ECM_2026" })
```
