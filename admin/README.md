# ShipLink Admin Dashboard

Admin control panel for the ShipLink delivery platform. Built with Next.js, TypeScript, Tailwind CSS, and TanStack Table.

## Features

- 🔐 **Admin Authentication** - Secure login with JWT tokens
- 👤 **User Management** - View, suspend, and manage all users
- 🚗 **Driver Verification** - Review ID documents, approve/reject drivers
- 📦 **Delivery Oversight** - Monitor deliveries, reassign drivers, resolve disputes
- 📝 **Content Management** - Update app content without redeployment (CMS-lite)
- 📊 **Dashboard Overview** - Real-time statistics and metrics
- 🔍 **Audit Logging** - Track all admin actions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (default: http://localhost:5444)

### Installation

1. Install dependencies:
```bash
cd admin
npm install
```

2. Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:5444
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Login

1. Create an admin user using the backend script:
```bash
cd ../backend
node scripts/create-admin.js
```

2. Default credentials:
   - Email: `admin@shiplink.com`
   - Password: `admin123`
   
   **⚠️ Change the password after first login!**

## Project Structure

```
admin/
├── app/
│   ├── dashboard/          # Dashboard pages
│   │   ├── users/          # User management
│   │   ├── drivers/        # Driver verification
│   │   ├── deliveries/     # Delivery oversight
│   │   └── content/        # Content management
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── providers.tsx       # React Query provider
├── lib/
│   ├── api.ts              # API client
│   └── auth.ts             # Auth utilities
└── middleware.ts            # Route protection
```

## API Endpoints

All admin endpoints are prefixed with `/api/admin`:

- `POST /api/admin/login` - Admin login
- `GET /api/admin/me` - Get current admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/deliveries` - Get all deliveries
- `GET /api/admin/content` - Get all content
- ... and more (see backend routes)

## Technologies

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Table** - Data tables
- **TanStack Query** - Data fetching
- **Axios** - HTTP client
- **js-cookie** - Cookie management

## Build for Production

```bash
npm run build
npm start
```

## Security Notes

- Admin tokens are stored in HTTP-only cookies (client-side)
- All routes are protected by middleware
- Role-based access control on backend
- Audit logging for all admin actions

