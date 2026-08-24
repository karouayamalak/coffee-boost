# Boost Coffee Shop ☕

Boost Coffee Shop is a full-stack artisanal coffee shop web application and ordering system with real-time order management, Algerian Dinar (DA) pricing, and private owner dashboard.

## Features

- **Artisanal Menu**: 19 researched items categorized across Specialty Drinks, Desserts & Fresh Bakery, and Savory Breakfast Plates.
- **Rainbow Treats Ribbon**: Interactive arch-curved treats showcase.
- **Cart & Pickup Order Drawer**: Seamless order ahead system supporting Cash on Pickup, BaridiMob, and CIB/Edahabia.
- **Table Reservations**: Date & time booking for counter/booth/patio seating.
- **Private Owner Dashboard**: PIN-gated order terminal for real-time order status management and revenue tracking.
- **MongoDB Cloud Sync**: Full database persistence with fallback in-memory datastore.

## Tech Stack

- **Frontend**: React 18, TanStack Router & Start, Tailwind CSS, Lucide Icons, Sonner Toaster
- **Backend**: Node.js, Express, MongoDB / Mongoose, Serverless Vercel API
- **Deployment**: Vercel & MongoDB Atlas

## Local Development

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# Run backend API server (port 5000)
npm run server
```

## Environment Variables

Copy `.env.example` to `.env`:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=production
OWNER_PIN=boost2026
```
