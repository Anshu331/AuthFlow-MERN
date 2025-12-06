# AuthFlow

A modern, secure authentication system built with MERN stack featuring user registration, login, and welcome email functionality.

![AuthFlow](https://img.shields.io/badge/AuthFlow-Authentication-blue)
![MERN](https://img.shields.io/badge/Stack-MERN-green)


## ✨ Features

- 🔐 **User Registration** - Secure account creation with validation
- 🔑 **User Login** - JWT-based authentication
- 📧 **Welcome Emails** - Automatic welcome emails via SMTP
- 🎨 **Modern UI** - Beautiful, responsive design with 3D effects
- 🔒 **Password Security** - Strong password requirements (8+ chars, uppercase, lowercase, number, special char)
- 💾 **MongoDB Storage** - Secure user data storage
- 🎯 **Remember Me** - Optional persistent login sessions
- ✅ **Form Validation** - Real-time validation with helpful error messages

## 🚀 Tech Stack

**Frontend:**
- React.js
- React Router DOM
- Axios
- React Toastify
- CSS3 (Gradients & Animations)

**Backend:**
- Node.js
- Express.js
- MongoDB
- JWT (JSON Web Tokens)
- bcryptjs
- Nodemailer (SMTP)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- SMTP email account (Gmail, Outlook, etc.)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd AuthFlow
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Configuration
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000

# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Email Customization
EMAIL_FROM_NAME=AuthFlow
FRONTEND_URL=http://localhost:5173
```

### 5. Get MongoDB Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `<password>` and `<dbname>` in the connection string

### 6. Generate JWT Secret

```bash
# Using OpenSSL
openssl rand -base64 32

# Or use any random string (at least 32 characters)
```

### 7. Setup SMTP (Gmail Example)

1. Enable 2-Factor Authentication on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an App Password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

## 🎯 Usage

### Start Backend Server

```bash
npm start
# or for development
npm run dev
```

Server will run on `http://localhost:3000`

### Start Frontend Development Server

```bash
cd client
npm run dev
```

Frontend will run on `http://localhost:5173`

### Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 📁 Project Structure

```
AuthFlow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS files
│   │   └── config/        # Configuration files
│   └── package.json
├── controllers/           # Backend controllers
├── models/               # MongoDB models
├── routes/               # API routes
├── utils/                # Utility functions
│   └── emailService.js   # SMTP email service
├── middleware/           # Express middleware
├── app.js               # Main server file
└── package.json
```

## 🔐 API Endpoints

- `POST /api/v1/register` - Register a new user
- `POST /api/v1/login` - User login
- `GET /api/v1/dashboard` - Protected dashboard route
- `GET /api/v1/users` - Get all users (for testing)

## 📧 Email Configuration

The application automatically sends welcome emails when users register. Configure your SMTP settings in the `.env` file.

### Supported Email Providers

- **Gmail** - `smtp.gmail.com:587`
- **Outlook** - `smtp-mail.outlook.com:587`
- **Yahoo** - `smtp.mail.yahoo.com:587`
- **Custom SMTP** - Any SMTP server

## 🎨 Features in Detail

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

### Remember Me
- Checked: Token stored in `localStorage` (persists across sessions)
- Unchecked: Token stored in `sessionStorage` (cleared on browser close)

### Form Validation
- Real-time validation on blur
- Specific error messages for each field
- Email format validation
- Password strength validation

## 🐛 Troubleshooting

### Email not sending?
- Verify SMTP credentials in `.env`
- Check spam folder
- For Gmail, use App Password (not regular password)
- Check server console for error messages

### MongoDB connection failed?
- Verify connection string is correct
- Check if IP is whitelisted in MongoDB Atlas
- Ensure database name is included in connection string

### Port already in use?
- Change `PORT` in `.env` file
- Or stop the process using the port

## 📝 License

ISC License

## 👤 Author

**Anshu Bishwas**

---

**Made with ❤️ using MERN Stack**

