# Repy Schedule - Loan Repayment Schedule Generator

## Project Overview
Repy Schedule is a modern web application that helps users generate loan repayment schedules. The application provides a user-friendly interface for inputting loan details and generates a comprehensive repayment schedule.

## Features

### 1. Loan Schedule Creation
- **Basic Information**
  - Total loan amount (mandatory)
  - Loan term in months (mandatory)
  - Interest rate (mandatory)
  - Disbursement date (optional, defaults to today)
  - First payment date (optional, defaults to disbursement date)

- **Advanced Information**
  - Promotional periods (optional)
    - Period duration in months
    - Promotional interest rate
  - Early repayment penalties (optional)
    - Time period (e.g., 12 months, 24 months)
    - Penalty percentage on remaining principal

### 2. Schedule Generation
The system generates a detailed repayment schedule including:
- Payment period number
- Payment date (adjusted for weekends)
- Principal amount per period
- Days in period
- Interest rate for the period
- Interest amount
- Total payment (principal + interest)
- Remaining principal

## Technical Requirements

### Frontend
- Next.js with TypeScript
- Tailwind CSS for styling
- shadcn/ui for UI components
- Responsive design (mobile-first approach)
- Modern, minimalist UI with iOS-inspired design
- Primary color theme: Green

### Backend
- Next.js API routes
- Input validation using Zod
- Business logic for schedule calculation
- Error handling and loading states

### Data Validation Rules
- Loan amount must be greater than 0
- Loan term must be between 1 and 600 months (50 years)
- No restrictions on interest rates
- All mandatory fields must be provided

## API Endpoints

### POST /api/schedules
Creates a new loan repayment schedule

**Request Body:**
```typescript
{
  totalAmount: number;
  loanTerm: number;
  interestRate: number;
  disbursementDate?: string;
  firstPaymentDate?: string;
  promotions?: Array<{
    period: number;
    interestRate: number;
  }>;
  earlyRepaymentPenalties?: Array<{
    period: number;
    penaltyRate: number;
  }>;
}
```

**Response:**
```typescript
{
  schedule: Array<{
    period: number;
    paymentDate: string;
    principalAmount: number;
    daysInPeriod: number;
    interestRate: number;
    interestAmount: number;
    totalPayment: number;
    remainingPrincipal: number;
  }>;
}
```

## Project Status

### Completed Features
1. Project Setup
   - Created Next.js project with TypeScript
   - Configured Tailwind CSS and shadcn/ui
   - Set up project structure and dependencies

2. Core Components
   - Created basic UI components (Button, Input, Label)
   - Implemented form validation using Zod
   - Created responsive layout with modern UI design

3. Schedule Generation
   - Implemented API endpoint for schedule generation
   - Added business logic for schedule calculation
   - Created form for schedule input with validation
   - Added support for promotions and penalties
   - Implemented schedule display with table view

4. Advanced Features
   - Added support for promotional periods
   - Added support for early repayment penalties
   - Implemented weekend date adjustment
   - Added error handling and loading states
   - Implemented request throttling and caching

### Upcoming Tasks
1. Data Export
   - Implement PDF export functionality
   - Add Excel export capability
   - Create export options UI

2. Data Persistence
   - Implement database integration
   - Add schedule storage functionality
   - Create schedule history view

3. Authentication
   - Add user authentication system
   - Implement user profile management
   - Add role-based access control

4. UI/UX Improvements
   - Add dark mode support
   - Implement responsive design for mobile devices
   - Add loading animations and transitions
   - Improve error messages and validation feedback

5. Testing
   - Add unit tests for components
   - Implement integration tests
   - Add end-to-end testing
   - Set up CI/CD pipeline

6. Documentation
   - Add API documentation
   - Create user guide
   - Add code documentation
   - Create deployment guide 