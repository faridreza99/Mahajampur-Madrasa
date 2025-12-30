# Overview

This Cloud School ERP is a multi-tenant, comprehensive management system for educational institutions, offering 19 core modules, role-based access control, and advanced AI capabilities. It includes an AI Assistant, AI Quiz Tool, AI Test Generator, AI Summary Generator, and AI Notes Generator. The system provides an enterprise-grade, scalable, and CMS-first solution with professional reporting, automated assessment tools, and strict data isolation for multiple tenants, aiming to streamline educational administration and enhance learning experiences.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Frontend Framework**: React 19 SPA using functional components and hooks.
- **Styling**: Tailwind CSS and Shadcn/ui for consistent and accessible UI components.
- **Dark Mode**: Comprehensive dark mode support across all routes with automatic theme detection.
- **Responsiveness**: Fully responsive design across all devices using Tailwind CSS breakpoints.
- **Madrasah UX Simplification**: Dedicated UI/UX for Madrasah tenants, featuring simplified menus, 100% Bengali language interfaces, and streamlined workflows for specific modules (e.g., Fee Wizard, Certificates).

## Technical Implementations
- **Frontend**: React 19, React Router DOM, Axios, Context API.
- **Backend**: FastAPI with async/await, JWT authentication, RBAC, and custom middleware.
- **Database**: MongoDB, designed for multi-tenant data isolation using `tenant_id` and `school_id`.
- **API**: RESTful design, modular organization, consistent error handling, Pydantic for data validation.
- **Mobile App**: React Native (Expo) for iOS/Android, integrating with the backend API.

## Feature Specifications
- **Multi-tenancy & RBAC**: Strict data isolation with granular permissions.
- **Core Modules**: Student admissions, attendance, fee management, curriculum, transport, staff, certificate, user management.
- **Academic Content CMS**: Hierarchical content management for books, question papers, and Q&A.
- **AI Modules**: AI Assistant (GPT-4o-mini with multi-modal input), AI Quiz Tool, AI Test Generator, AI Summary Generator, AI Notes Generator (all CMS-first and RAG-based).
- **GiNi School Dashboard**: Professional analytics for AI module usage.
- **Enhanced Class & Subject Management**: Dynamic subject integration.
- **Calendar & Timetable Modules**: Event management and advanced timetable scheduling.
- **Notification Module**: Event-driven system with in-app, email, and customizable templates.
- **Pop-up Rating/Review Module**: Flexible feedback collection.
- **Bulk Student Upload**: Excel/CSV import with validation.
- **Student Result Automation**: Comprehensive result management, grading, and publication.
- **Dynamic Currency System**: Global currency configuration for financial modules.
- **Enterprise Payroll Management System**: Complete payroll solution with salary structure, attendance/leave integration, payment tracking, payslip generation, and comprehensive reports.
- **Enterprise Attendance Management System**: Rule-based attendance, biometric integration, offline sync, parent notifications, and AI insights.
- **ID Card Generation System**: Student and staff ID card generation with QR codes and school branding.
- **Madrasah Specific Features**: Madrasah Class Management, Madrasah Simple Fee Wizard, Professional Madrasah Receipt, Simplified Madrasah Certificate System, **Madrasah Simple Result System** (মুমতাজ/জায়্যিদ জিদ্দান/জায়্যিদ/মাকবুল/রাসেব grading with print), **Madrasah Simple Routine System** (সহজ সাপ্তাহিক রুটিন with print), all with full Bengali support and Madrasah-specific nomenclature. Madrasah sidebar shows only: সহজ ফলাফল, সহজ রুটিন (instead of complex Results/TimeTable).

## System Design Choices
- **Build Tooling**: Create React App with Craco and Webpack.
- **Development Environment**: Hot reloading.
- **React Performance**: Consistent use of `useCallback` with `useEffect`.

# External Dependencies

## Frontend
- **React Ecosystem**: React 19, React DOM, React Router DOM.
- **UI & Styling**: Shadcn/ui (Radix UI), Tailwind CSS.
- **Forms & Validation**: React Hook Form.
- **Utilities**: Axios, Recharts, Lucide React, date-fns, Sonner.

## Backend
- **Web Framework**: FastAPI, Uvicorn.
- **Database Drivers**: MongoDB, Motor, PyMongo.
- **Authentication/Security**: PyJWT, bcrypt, python-jose.
- **Data & Configuration**: Pydantic, python-dotenv, Pandas, NumPy.
- **File Handling**: python-multipart.
- **AI/ML**: OpenAI (GPT-4o-mini, Whisper, TTS), Tesseract OCR (Pytesseract), Pillow.
- **Reporting**: ReportLab (PDF), openpyxl (Excel).

## Cloud Services & Integrations
- **Database Hosting**: MongoDB Atlas.
- **Multi-tenancy**: Subdomain or header-based tenant detection.
- **Email Integration**: Replit Mail API.

## Mobile App (React Native / Expo)
- **Framework**: React Native 0.81.5 with Expo SDK 54.
- **Navigation**: React Navigation.
- **Dependencies**: axios, @react-native-async-storage/async-storage, expo-linear-gradient, @react-native-picker/picker.
- **API Integration**: Centralized API service layer with axios interceptors for JWT token and tenant ID.