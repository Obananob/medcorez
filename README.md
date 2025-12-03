# MedCore - Hospital Management System

<div align="center">
  <img src="public/favicon.svg" alt="MedCore Logo" width="80" height="80">
  
  **A modern, multi-tenant hospital management system built for healthcare organizations**
  
  [Live Demo](https://lovable.dev/projects/fdcd3d97-e47b-4bbe-bb5c-7c49399145d3) · [Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues)
</div>

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)

---

## About The Project

MedCore is a comprehensive hospital management system designed to streamline healthcare operations. It provides a centralized platform for managing patients, appointments, staff, inventory, prescriptions, and billing across multiple healthcare organizations.

### Why MedCore?

- **Multi-Tenant Architecture**: Each hospital/clinic operates in complete isolation with their own data, staff, and settings
- **Role-Based Access Control**: Five distinct roles (Admin, Doctor, Nurse, Receptionist, Pharmacist) with appropriate permissions
- **Real-Time Operations**: Live updates for appointments, triage, and patient management
- **PWA Support**: Install as a native app on any device for offline-capable access
- **Modern UI/UX**: Clean, responsive interface built with accessibility in mind

---

## Features

### 👥 Patient Management
- Patient registration with medical record numbers
- Comprehensive patient profiles (demographics, allergies, emergency contacts)
- Patient search and filtering
- Avatar upload support

### 📅 Appointment Scheduling
- Book, reschedule, and cancel appointments
- Real-time appointment status tracking
- Doctor assignment and availability management
- Appointment history and notes

### 🩺 Clinical Consultation
- Triage system with priority levels (Emergency, Urgent, Standard, Low)
- Vital signs recording (BP, heart rate, temperature, weight, height)
- Diagnosis documentation
- Doctor notes and clinical observations

### 💊 Prescription Management
- Digital prescription creation
- Medication details (dosage, frequency, duration)
- Dispense status tracking
- Prescription notes

### 📦 Inventory Management
- Medical supplies and medication tracking
- Stock quantity monitoring
- Expiry date tracking
- Price per unit management

### 💰 Finance & Billing
- Invoice generation
- Payment status tracking
- Consultation fee management
- Financial reporting

### 👨‍⚕️ Staff Management
- Staff registration and profiles
- Role assignment (Admin, Doctor, Nurse, Receptionist, Pharmacist)
- Active/inactive status management
- Staff avatar uploads

### ⚙️ Organization Settings
- Hospital/clinic profile management
- Custom currency symbol
- Logo upload
- Contact information and timezone settings

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library |
| **React Router v6** | Client-side routing |
| **TanStack Query** | Server state management |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |
| **Recharts** | Data visualization |
| **Lucide React** | Icon library |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database |
| **Row Level Security** | Data isolation |
| **Edge Functions** | Serverless API |
| **Supabase Auth** | Authentication |
| **Supabase Storage** | File uploads |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Lovable** | Development platform |
| **GitHub** | Version control |
| **PWA** | Progressive Web App |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Supabase account (for backend)

### Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/your-username/medcore.git

# Or clone via SSH
git clone git@github.com:your-username/medcore.git

# Navigate to project directory
cd medcore
```

### Fork the Repository

1. Click the **Fork** button at the top right of the GitHub repository page
2. Select your GitHub account
3. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/medcore.git
   ```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` folder
3. Deploy edge functions from `supabase/functions/`
4. Configure authentication providers as needed

---

## Project Structure

```
medcore/
├── public/                 # Static assets
│   ├── favicon.svg        # App favicon
│   ├── pwa-192x192.png    # PWA icons
│   └── robots.txt         # SEO configuration
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── AppHeader.tsx # Main header
│   │   ├── AppSidebar.tsx# Navigation sidebar
│   │   └── ...
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom React hooks
│   │   ├── useOrganization.ts
│   │   ├── usePWAInstall.ts
│   │   └── ...
│   ├── integrations/     # Third-party integrations
│   │   └── supabase/
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   ├── Appointments.tsx
│   │   ├── Consultation.tsx
│   │   ├── Inventory.tsx
│   │   ├── Finance.tsx
│   │   ├── Staff.tsx
│   │   └── Settings.tsx
│   ├── App.tsx           # Root component
│   ├── index.css         # Global styles
│   └── main.tsx          # Entry point
├── supabase/
│   ├── functions/        # Edge functions
│   │   └── create-user/  # User creation API
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
├── index.html            # HTML template
├── tailwind.config.ts    # Tailwind configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies
```

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `organizations` | Hospital/clinic entities |
| `profiles` | User profiles linked to auth |
| `user_roles` | Role assignments (admin, doctor, nurse, etc.) |
| `staff` | Staff member details |
| `patients` | Patient records |
| `appointments` | Scheduled appointments |
| `vitals` | Patient vital signs |
| `prescriptions` | Medication prescriptions |
| `inventory` | Medical supplies stock |
| `invoices` | Billing records |

### Multi-Tenancy

All tables include an `organization_id` column with Row Level Security (RLS) policies ensuring complete data isolation between organizations.

---

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed
- Test your changes thoroughly

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Backend powered by [Supabase](https://supabase.com)

---

<div align="center">
  <strong>Made with ❤️ for healthcare</strong>
  <br>
  © 2025 MedCore
</div>
