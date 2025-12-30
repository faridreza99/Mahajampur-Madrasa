# Overview

This Cloud School ERP is a multi-tenant, comprehensive management system designed for educational institutions. It offers 19 core modules, role-based access control, and advanced AI capabilities including an AI Assistant (GPT-4o-mini with OCR/voice), AI Quiz Tool, AI Test Generator, AI Summary Generator, and AI Notes Generator. The system aims to provide an enterprise-grade, scalable, and CMS-first solution with professional reporting and automated assessment tools, ensuring data isolation for multiple tenants.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Frontend Framework**: React 19 SPA using functional components and hooks.
- **Styling**: Tailwind CSS and Shadcn/ui for consistent styling and accessible UI components.
- **Dark Mode**: Comprehensive dark mode support across all routes using Tailwind CSS `dark:` variants with automatic theme detection.
- **Responsiveness**: Fully responsive design across all devices using Tailwind CSS breakpoints and adaptive layouts.

## Recent Changes (December 2025)
- **Madrasah Class Management System**: Institution type toggle (School/Madrasah) with full Bengali class names support for Madrasah levels: Ebtedayee (ইবতেদায়ী ১ম-৫ম বর্ষ), Dakhil (দাখিল ৬ষ্ঠ-১০ম শ্রেণি), Alim (আলিম ১ম-২য় বর্ষ), plus special classes (Nazera, Hifz, Kitab). Admin CRUD operations with safe delete (usage check), enable/disable toggle, and drag-to-reorder. Internal standard mapping (1-12) preserves analytics compatibility.
- **Finance Module Bug Fixes**: Fixed "Process Payment & Generate Receipt" button in Collection tab (was missing onClick handler), fixed student dashboard fee calculation to compute from payments when no fee_ledger exists, corrected backend query to use `payments` collection instead of `fee_payments`.
- **Dynamic Currency System**: All financial modules now use CurrencyContext to display school's configured currency (BDT ৳, USD $, INR ₹, EUR €, GBP £) instead of hardcoded symbols.
- **Enterprise Payroll Management System**: Complete payroll module with attendance/leave integration, salary structure management, payroll processing workflow (Draft → Approved → Locked), bonus & advance management, payment tracking (Bank/bKash/Nagad/Rocket/Cash), payslip PDF generation with school branding, and comprehensive reports (monthly, department-wise, yearly). Role-based access for super_admin, admin, and accountant.
- **School Branding in All Reports**: All PDF and Excel reports across the website now use the school branding (logo, name, address, colors) set by the school admin. Added `get_school_branding_for_reports()` helper function to fetch branding consistently.
- **Enterprise Attendance Management System**: Complete attendance management with rule-based status calculation (on-time, late, absent, half-day), biometric device integration (ZKTeco), offline sync with conflict resolution, parent notifications (SMS/App), AI-assisted insights for at-risk students, and comprehensive audit logging.
- **Enhanced Student Attendance UI**: Added Late (দেরি) and Half-day (অর্ধদিবস) status options with Bengali translations, updated summary cards to show all 5 attendance statuses.
- **Blank Question Paper Template**: Added delete section functionality with Bengali/English confirmation dialog.
- **Dark Mode Fixes**: Added comprehensive dark mode support to 15+ components including LoginPage, Calendar, Results, StudentResults, ParentResults, RatingSurveys, QuizTool, TestGenerator, AINotes, AISummary, BiometricDevices, Reports, AcademicCMS, Vehicle, and StaffList.
- **School-wise User Management**: Super_admin can now manage users across all schools in Tenant Management. Features include Edit User modal (name, email, role, status), Reset Password modal with manual entry and auto-generate options, clickable status badges for quick activate/deactivate, and cross-tenant management via target_tenant_id parameter. All actions are logged with admin details and IP address.
- **ID Card Generation System**: Complete ID card generation for students and staff with PDF output, QR codes, and school branding. Student ID cards include: name (Bengali), father's name, class/marhala, section, roll number, photo, institution logo. Staff ID cards include: name, designation, department, employee ID, photo. Features class/section/department filtering, view/download/print functionality, and credit card sized (3.375 x 2.125 inches) professional output.
- **Madrasah Simple Fee Wizard (December 30, 2025)**: Complete redesign of Madrasah fee collection interface replacing the 3-tab structure with a linear 3-step wizard:
    - **Step 1 - ছাত্র নির্বাচন (Student Selection)**: Marhala/Section dropdowns, simplified student cards showing only name, roll number, "বকেয়া আছে/নেই" badge, and large "বেতন নিন" button. Includes Marhala Fee Overview Panel showing configured monthly fees per class with active status.
    - **Step 2 - বেতন আদায় (Fee Collection)**: Streamlined form with only amount input + optional remarks, auto-populated student info
    - **Step 3 - রসিদ প্রিন্ট (Receipt Printing)**: Professional print-ready receipt with school branding
    - 100% Bengali language throughout (no English visible)
    - Wizard step indicator with Bengali numerals (১, ২, ৩)
    - State management: `madrasahWizardStep` and `lastReceipt` states for wizard flow
    - Sidebar hides: Fee Structure, Fee Reports, Accounts, Payroll (keeps only Fees)
    - Bengali fallback for missing student names: "ছাত্র #..." (no "Unknown Student")
    - InstitutionContext with loading guard prevents UI flash
- **Professional Madrasah Receipt (December 30, 2025)**: Standard print-ready receipt for Madrasah fee collection:
    - **Header**: Institution name (Bengali), logo, address, phone from school branding settings
    - **Receipt Info**: Receipt number, date, month, academic year
    - **Student Info**: Name, roll number, class/marhala, admission number
    - **Payment Info**: Fee type (মাসিক বেতন), payment method (Cash), amount, paid status
    - **Footer**: "Office Copy / Computer Generated Receipt" text, signature and seal placeholders
    - A5/A6 print-friendly layout with proper @media print CSS
    - Auto-loads institution settings from `/api/school-branding` endpoint
    - Bengali text throughout for Madrasah mode

## Technical Implementations
- **Frontend**: React 19, React Router DOM, Axios, Context API.
- **Backend**: FastAPI with async/await, JWT authentication, RBAC, and custom middleware.
- **Database**: MongoDB, designed for multi-tenant data isolation using `tenant_id` and `school_id`.
- **API**: RESTful design, modular organization, consistent error handling, Pydantic for data validation.
- **Mobile App**: React Native (Expo) for iOS/Android, integrating with the backend API for key functionalities.

## Feature Specifications
- **Multi-tenancy & RBAC**: Strict data isolation for schools with granular permissions (super_admin, admin, teacher, student, parent).
- **Core Modules**: Student admissions, attendance, fee management, curriculum, transport, staff management, certificate generation, and user management.
- **Academic Content CMS**: Hierarchical content management system for academic books, reference books, previous years' question papers, and a Q&A knowledge base, supporting file uploads and CRUD operations.
- **AI Modules**:
    - **AI Assistant**: GPT-4o-mini powered chatbot with multi-modal input (text, OCR, voice), RAG, and a CMS-first approach for academic content.
    - **AI Quiz Tool (Student)**: AI-powered quiz generation with customizable filters, auto-grading, and performance tracking.
    - **AI Test Generator (Teacher/Admin)**: AI-powered test generation with curriculum alignment, mixed question types, inline editing, and scheduling.
    - **AI Summary Generator**: Generates structured summaries using a 3-tier RAG CMS-first strategy.
    - **AI Notes Generator**: Generates detailed study notes with examples and practice questions using a 3-tier RAG CMS-first strategy.
- **GiNi School Dashboard**: Professional analytics dashboard providing real-time usage statistics for all AI modules with dynamic filters and interactive charts.
- **Enhanced Class & Subject Management**: Comprehensive module for managing classes, sections, and class-specific subjects, with dynamic subject integration across the ERP.
- **Calendar Module**: School calendar with monthly view, event types, role-based permissions, and tenant isolation.
- **Timetable Module**: Advanced timetable management with automatic period slot adjustment, break configurations, and editable periods.
- **Notification Module**: Event-driven notification system with automatic triggers, role-based access, in-app display, email integration, and customizable templates.
- **Pop-up Rating/Review Module**: Flexible feedback collection system with various formats (rating, MCQ) and response analytics.
- **Bulk Student Upload**: Import multiple students via Excel/CSV with validation, duplicate detection, and progress tracking.
- **Student Result Automation**: Comprehensive result management including exam term configuration, mark entry, bulk upload, automatic grading, publication workflow, and student/parent viewing portals.
- **Dynamic Currency System**: Global currency configuration for the institution, applied across financial modules.
- **Enterprise Payroll Management System**: Complete payroll solution with:
    - Salary structure management (basic, allowances, deductions)
    - Attendance & leave integration for automatic salary calculation
    - Payroll processing workflow (Draft → Approved → Locked)
    - Bonus management (Eid, Hadiya, Performance bonuses)
    - Advance/loan tracking with monthly deductions
    - Payment tracking (Bank, bKash, Nagad, Rocket, Cash)
    - Professional payslip PDF generation with school branding
    - Comprehensive reports (monthly, department-wise, employee-wise, yearly)
    - Role-based access (super_admin, admin, accountant, staff)

## System Design Choices
- **Build Tooling**: Create React App with Craco and Webpack.
- **Development Environment**: Hot reloading development server.
- **React Performance**: Consistent use of `useCallback` with `useEffect` for async fetches to prevent re-renders.

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
- **Navigation**: React Navigation (Stack, Tab, Drawer navigators).
- **Dependencies**: axios, @react-native-async-storage/async-storage, expo-linear-gradient, @react-native-picker/picker.
- **Screens (22 total)**:
  - Core: Login, Dashboard, Profile, Settings
  - AI Features: Assistant, Quiz, Summary, Notes, TestGenerator
  - Academic: TimeTable, Calendar, Attendance, Results, AcademicCMS
  - Management: StudentList, StaffList, ClassManagement, UserManagement
  - Financial: Fees, Certificates
  - Communication: CommunicationScreen
  - Analytics: Reports
- **Role-Based Navigation**: Different menu items and quick access buttons for super_admin, admin, teacher, principal, student, and parent roles.
- **API Integration**: Centralized API service layer in `mobile/src/services/api.js` with axios interceptors for JWT token and tenant ID handling.