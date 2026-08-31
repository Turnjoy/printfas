# PRINTFAS - Express Document Printing

A Progressive Web App (PWA) for express document printing services, powered by Corporate PC Ltd. Built with static HTML, Tailwind CSS, and Supabase backend.

## 🚀 Features

- **Client Frontend**: Multi-file upload, real-time pricing, service selection with dynamic add-ons
- **Admin Dashboard**: Order management, status updates, file downloads with 3-hour auto-deletion
- **PWA Support**: Installable app, offline caching, service worker
- **Payment Integration**: Paystack inline payments and bank transfer options
- **Order Tracking**: Public order reference tracking with status updates
- **Smart Validation**: Paper size compatibility for finishing options (A4/A3 laminating/binding)

## 📋 Tech Stack

- **Frontend**: HTML5, Tailwind CSS (CDN), Vanilla JavaScript (ES6 Modules)
- **Backend**: Supabase (Postgres, Storage, Edge Functions)
- **Hosting**: Cloudflare Pages (static deployment)
- **Payments**: Paystack API
- **PWA**: Web App Manifest, Service Worker

## 🛠️ Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migration script in the Supabase SQL Editor:
   ```bash
   supabase/migrations/001_initial_schema.sql
   ```
3. Create an admin user in the Supabase Auth dashboard
4. Manually insert the admin profile with role='admin':
   ```sql
   INSERT INTO profiles (id, role, email, full_name)
   VALUES ('YOUR_ADMIN_USER_ID', 'admin', 'admin@printfas.com', 'Admin User');
   ```

### 2. Environment Variables

Create a `.env` file or configure in Cloudflare Pages:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
CRON_SECRET=your_random_secret_for_cron_jobs
```

### 3. Deploy Edge Functions

Deploy the Supabase Edge Functions:

```bash
# From the supabase/functions directory
supabase functions deploy create-checkout
supabase functions deploy paystack-webhook
supabase functions deploy download-and-mark
supabase functions deploy delete-expired-files
```

Set environment variables for each function in the Supabase dashboard.

### 4. Configure Paystack Webhook

1. Set up the webhook URL in your Paystack dashboard:
   ```
   https://your-project.supabase.co/functions/v1/paystack-webhook
   ```
2. Configure the webhook to listen for `charge.success` events

### 5. Add App Icons

Replace the placeholder icons in the `icons/` directory:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

### 6. Update Configuration

Update the Supabase credentials in both JavaScript files:

**In `app.js`:**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

**In `admin.js`:**
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 7. Deploy to Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build output directory to root (no build process needed)
3. Add environment variables in Cloudflare Pages settings
4. Deploy!

## 📁 Project Structure

```
printfas/
├── index.html                 # Client frontend
├── admin.html                 # Admin dashboard
├── app.js                     # Client application logic
├── admin.js                   # Admin dashboard logic
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker
├── icons/                     # PWA app icons
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       ├── create-checkout/
│       ├── paystack-webhook/
│       ├── download-and-mark/
│       └── delete-expired-files/
└── README.md
```

## 🔑 Key Features Explained

### Dynamic Paper Size Validation
- A4 services enable A4 laminating/binding options
- A3 services enable A3 laminating/binding options
- Non-paper services (ID cards, design) disable all finishing options

### Multi-File Upload System
- Drag & drop or click to upload multiple files
- Per-file page count and copy configuration
- Custom instructions for each file
- Large file (>25MB) WhatsApp fallback

### Real-Time Pricing Engine
```
Total = (Service Price × Pages × Copies) + Finishing Options + Delivery Fee
```

### Order Tracking
- Public tracking by order reference
- Visual progress indicator
- 3-hour download window with expiration warning

### Admin Dashboard
- Order management with status updates
- File download with auto-deletion timer
- Custom quote generation for special orders
- Delivery badge display (PICKUP/DELIVERY)

## 🔒 Security Features

- Row Level Security (RLS) on Supabase tables
- Admin-only access to dashboard
- Signed URLs for file downloads (60-second expiry)
- Paystack webhook signature verification
- 3-hour automatic file deletion after download

## 📱 PWA Installation

Users can install PRINTFAS on their devices:
- Desktop: "Install App" button appears in header
- Mobile: Add to Home Screen from browser menu

## 🧪 Testing

Before deploying to production:
1. Test file upload with various file types
2. Verify pricing calculations
3. Test Paystack payment flow
4. Check admin authentication
5. Verify order status updates
6. Test file download and deletion timer

## 🚨 Cron Job Setup

Set up a cron job to call the `delete-expired-files` function periodically:

```bash
# Every hour
0 * * * * curl -X POST https://your-project.supabase.co/functions/v1/delete-expired-files -H "x-cron-secret: YOUR_CRON_SECRET"
```

## 📞 Business Details

- **Name**: PRINTFAS (Powered by Corporate PC Ltd)
- **Address**: 15 Akiogun Road, New Market, Opposite Item7go, Victoria Island / Oniru, Lagos
- **Bank Accounts**:
  - FCMB: 2008391004
  - First Bank: 2015124252
  - Account Name: Corporate PC Ltd

## 🤝 Support

For issues or questions, contact Corporate PC Ltd support.

## 📄 License

Proprietary - Corporate PC Ltd
