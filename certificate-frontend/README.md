# EduLedger Frontend

A modern Next.js frontend for the blockchain certificate management system.

## Features

- **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Responsive Design**: Mobile-first approach with clean, professional styling
- **Role-based Dashboards**: Different interfaces for Issuers, Students, and HR
- **Icon Integration**: Beautiful icons from Lucide React
- **Authentication**: Secure login system with role-based access
- **Component Library**: Reusable UI components with Radix UI primitives

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives
- **State Management**: React Context API

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Credentials

### Issuer Account
- Username: `issuer324`
- Password: `isse324`
- Features: Issue certificates, manage students, view blockchain

### Student Account
- Username: `student02`
- Password: `stud02`
- Features: View certificates, manage consents, verify certificates

### HR Account
- Username: `HR023`
- Password: `hr023`
- Features: Verify certificates, view accessible certificates

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
```

## Features by Role

### Issuer Dashboard
- Add new students
- View student directory
- Issue certificates with PDF upload
- View wallet information
- Explore blockchain

### Student Dashboard
- View certificate portfolio
- Download certificate PDFs
- Verify certificate authenticity
- Manage HR consents
- View wallet information

### HR Dashboard
- Verify certificate authenticity
- View certificate details (with consent)
- Access granted certificates
- View wallet information

## Design System

The application uses a clean, modern design with:
- **Colors**: Black and white theme with gray accents
- **Typography**: Inter font family
- **Icons**: Lucide React icon library
- **Layout**: Card-based design with proper spacing
- **Responsive**: Mobile-first responsive design

## API Integration

Currently uses mock authentication. To connect to the Python backend:

1. Create API endpoints in your Python backend
2. Update the `useAuth` hook to call real APIs
3. Add API integration for certificate operations
4. Implement real-time blockchain data fetching

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the EduLedger certificate management system.