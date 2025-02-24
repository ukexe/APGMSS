# AI-Powered Grievance Management and Solution System

## Overview
A modern, AI-powered grievance management system built with Next.js and Supabase, designed to streamline the process of submitting, tracking, and resolving grievances in organizations. The system leverages artificial intelligence for intelligent categorization, priority assessment, and solution recommendations.

## Key Features

### 1. Multi-language Support
- Supports both English and Tamil languages
- Real-time language switching
- Automatic translation of grievances and responses
- Language-specific UI elements

### 2. AI-Powered Analysis
- Automatic categorization of grievances using NLP
- Priority assessment based on content analysis
- Pattern detection in recurring grievances
- Sentiment analysis for urgency detection
- Intelligent solution recommendations

### 3. Document Processing
- OCR support for scanned documents
- Support for multiple file formats (PDF, images)
- Handwritten text recognition
- Automatic text extraction and analysis

### 4. Real-time Tracking
- Live status updates
- Progress tracking with visual indicators
- Blockchain-based verification
- Immutable grievance records
- Complete audit trail

### 5. Smart Chatbot Assistant
- Context-aware responses
- Guided grievance submission
- FAQ handling
- Real-time support
- Multi-language interaction

### 6. User Management
- Anonymous submission support
- Role-based access control
- Customizable user preferences
- Profile management
- Notification settings

### 7. Notification System
- Email notifications
- In-app notifications
- Status update alerts
- Reminder system
- Customizable notification preferences

## Technical Stack

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: React Context API
- **Chatbot**: react-chatbot-kit

### Backend
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Real-time subscriptions
- **Serverless Functions**: Edge Functions (Supabase)

### AI/ML Components
- **NLP**: Natural.js
- **OCR**: Tesseract.js
- **Sentiment Analysis**: sentiment.js
- **Text Similarity**: string-similarity
- **Translation**: LibreTranslate (self-hosted)

### Storage & Security
- **Blockchain**: IPFS for immutable records
- **Email**: Nodemailer (with Ethereal for testing)
- **Environment Variables**: Next.js environment configuration
- **API Security**: Supabase RLS (Row Level Security)

## Project Structure
```
src/
├── app/                    # Next.js 13+ App Router
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── login/            # Authentication
│   ├── profile/          # User profile
│   ├── notifications/    # Notification center
│   └── track/            # Grievance tracking
├── components/           # Reusable components
│   ├── chatbot/         # Chatbot components
│   └── widgets/         # UI widgets
├── contexts/            # React contexts
├── lib/                 # Utility functions
│   ├── ai-processing.ts # AI/ML utilities
│   ├── blockchain.ts    # IPFS integration
│   ├── ocr-processing.ts# Document processing
│   └── supabase.ts     # Database client
└── types/              # TypeScript definitions
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- IPFS node (optional, for blockchain features)
- LibreTranslate instance (optional, for translation)

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
NEXT_PUBLIC_INFURA_API_ENDPOINT=your_infura_endpoint
NEXT_PUBLIC_IPFS_ENDPOINT=your_ipfs_endpoint
```

### Installation Steps
1. Clone the repository:
```bash
git clone https://github.com/yourusername/grievance-management-system.git
cd grievance-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
- Run Supabase migrations from `supabase/migrations`
- Initialize the database with default categories

4. Start the development server:
```bash
npm run dev
```

### Database Setup
Execute migrations in order:
1. `001_initial_schema.sql` - Base tables and enums
2. `002_status_update_trigger.sql` - Notification triggers
3. `003_blockchain_records.sql` - IPFS integration
4. `004_notifications.sql` - Notification system

## API Documentation

### Grievance Endpoints
- `POST /api/grievances` - Submit new grievance
- `GET /api/grievances` - List grievances
- `GET /api/grievances/{id}` - Get specific grievance
- `PATCH /api/grievances/{id}` - Update grievance status

### Notification Endpoints
- `POST /api/notifications/send-email` - Send email notification
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/{id}` - Mark as read

### AI Processing Endpoints
- `POST /api/analyze` - Analyze grievance text
- `POST /api/ocr` - Process document images
- `POST /api/translate` - Translate text

## Testing

### Running Tests
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

### Test Utilities
- Test accounts available in `src/utils/testUtils.ts`
- Mock data in `__mocks__` directory
- E2E test suites in `cypress/integration`

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Deployment Checklist
1. Set up production environment variables
2. Configure Supabase production project
3. Set up CORS policies
4. Configure email service
5. Set up monitoring and logging
6. Configure SSL certificates

## Maintenance

### Scheduled Tasks
- Daily: Clean up old notifications
- Weekly: Archive resolved grievances
- Monthly: Generate analytics reports

### Monitoring
- Server health checks
- Database performance monitoring
- API endpoint monitoring
- Error tracking and logging

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, email support@grievance-system.com or create an issue in the repository.

## Acknowledgments
- Supabase team for the excellent BaaS platform
- Next.js team for the amazing framework
- All contributors and testers 