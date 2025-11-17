# MaidMatch Web App

React web application for the MaidMatch platform - connecting homeowners with professional maids.

## 🚀 Features

- **User Authentication** - Login and registration for homeowners and maids
- **Role-Based Dashboards** - Different interfaces for homeowners, maids, and admins
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Modern UI** - Built with TailwindCSS and Lucide icons

## 📋 Prerequisites

- Node.js 18+ and npm
- Django backend running on http://localhost:8000

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000**

## 🏗️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **TailwindCSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 📁 Project Structure

```
src/
├── components/       # Reusable components
│   └── ProtectedRoute.jsx
├── context/          # React context providers
│   └── AuthContext.jsx
├── pages/            # Page components
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Dashboard.jsx
├── services/         # API services
│   └── api.js
├── App.jsx           # Main app component
├── main.jsx          # Entry point
└── index.css         # Global styles
```

## 🔐 Authentication

Session-based authentication with Django backend. User sessions managed via cookies.

### Test Credentials

- **Homeowner:** homeowner1 / home123
- **Maid:** maid1 / maid123
- **Admin:** admin / admin123

## 🛣️ Routes

- `/` - Redirects to login
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)

## 🔌 API Integration

Connects to Django backend API at `http://localhost:8000/api/`

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 📝 Next Steps

- Implement job posting interface
- Add maid search and filtering
- Create job application flow
- Add review and rating system
- Implement profile management
