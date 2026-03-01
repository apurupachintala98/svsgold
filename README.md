# Gold CRM - React Vite Application

A modern, responsive Gold CRM account management system built with pure React, Vite, and Tailwind CSS 3.4.

## Features

- **Login Page**: Mobile and Email-based account verification
- **Account Creation**: Comprehensive account creation form with multiple sections:
  - Account Information (personal details, IDs, income)
  - Address Information (with billing address auto-fill option)
  - Bank Accounts (with primary account selection)
  - Documents (file upload with validation)
- **Rich Input Fields**: Beautiful, shiny text fields with gradient backgrounds and glow effects
- **Form Validations**: Built-in validators for:
  - Mobile numbers (10 digits)
  - Email addresses
  - Aadhar numbers (12 digits)
  - PAN numbers
  - GST numbers
  - Pincodes (6 digits)
  - IFSC codes
  - Account numbers
  - Date of birth
  - Income validation
- **Accordion Sections**: Collapsible form sections for better organization
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **API Integration**: Pre-configured API calls to the Gold CRM backend

## Tech Stack

- **React 18.2** - UI library
- **Vite 5.0** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Axios** - HTTP client for API calls
- **Lucide React** - Icon library

## Project Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
# or
pnpm build
```

### 4. Preview Production Build

```bash
npm run preview
# or
pnpm preview
```

## Project Structure

```
src/
├── components/
│   ├── LoginPage.jsx              # Login with mobile/email
│   ├── CreateAccountPage.jsx      # Main account creation form
│   ├── AccountInformation.jsx     # Account details section
│   ├── AddressInformation.jsx     # Address management section
│   ├── BankAccounts.jsx           # Bank account management section
│   └── Documents.jsx              # Document upload section
├── api/
│   └── api.js                     # API configuration and endpoints
├── utils/
│   └── validation.js              # Form validation utilities
├── App.jsx                        # Main application component
├── main.jsx                       # React entry point
└── index.css                      # Global styles

public/
└── (static assets)

tailwind.config.js                 # Tailwind configuration
vite.config.js                     # Vite configuration
postcss.config.js                  # PostCSS configuration
package.json                       # Dependencies
```

## API Endpoints

The application integrates with the following endpoints:

- `POST /accounts/check` - Check if account exists
- `POST /accounts/create` - Create new account
- `GET /accounts/addresses` - Get addresses for a user
- `POST /accounts/addresses` - Add new address
- `GET /accounts/bank-accounts` - Get bank accounts
- `POST /accounts/bank-accounts` - Add bank account
- `GET /accounts/documents` - Get documents
- `POST /accounts/documents` - Upload documents

Base URL: `https://svs-gold-1.onrender.com`

## Form Fields

### Account Information
- Account Type (Individual, Business, Partnership, HUF)
- Account Code
- First Name & Last Name
- Contact Person
- Mobile (with ISD code selector)
- Phone (10 digits)
- Email
- Gender
- Date of Birth
- Aadhar Number (12 digits)
- PAN Number
- GST Number
- Occupation
- Yearly Income
- State, District, City
- Pincode (6 digits)
- Address Text

### Address Information
- Address Type (Shipping, Billing, Residential, Office)
- Address Line
- Street
- City
- State
- Pincode
- Country (auto-filled as India)
- Same as Billing Address Checkbox

### Bank Accounts
- Bank Name
- Branch
- Account Number (9-18 digits)
- IFSC Code
- Account Holder Name
- Account Holder Type (Self, Spouse, Business Partner, Parent, Child, Other)
- Primary Account Checkbox

### Documents
- Document Type (Aadhar Card, PAN Card, Passport, etc.)
- Document Number
- File Upload (Max 5MB, formats: PDF, JPG, PNG, DOC)

## Validation Rules

All input fields have built-in validation:

- **Mobile/Phone**: Must be exactly 10 digits
- **Email**: Standard email format validation
- **Aadhar**: Must be exactly 12 digits
- **PAN**: Format ABCDE1234F (5 letters, 4 numbers, 1 letter)
- **GST**: 15-character format validation
- **Pincode**: Must be exactly 6 digits
- **IFSC Code**: Format XXXX0XXXXXX (4 letters, 0, 6 alphanumeric)
- **Account Number**: 9-18 digits
- **Date of Birth**: Must be in the past

## Color Scheme

- **Primary Green**: #16a34a
- **Accent Gold**: #f59e0b
- **Dark Text**: #1f2937
- **Light Background**: #f9fafb

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Support

For issues and questions, please contact the development team.
