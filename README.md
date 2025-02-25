# AI-Powered Grievance Management and Solution System

A modern, AI-powered system for managing and tracking grievances with support for multiple languages and automated processing.

## Features

### Core Functionality
- Submit grievances in English or Tamil
- Track grievance status and progress
- Real-time notifications for updates
- Admin dashboard for grievance management
- Workflow-based grievance processing
- File upload support with OCR

### AI Integration
- Automated text extraction from documents
- Multi-language support (English + Tamil)
- Smart categorization of grievances
- Priority assessment
- Sentiment analysis

### Technical Features
- Real-time updates using Supabase
- Secure authentication and authorization
- Row Level Security (RLS) for data protection
- Responsive design for all devices
- Progressive Web App (PWA) support

## Getting Started

### Prerequisites
```bash
Node.js >= 14.0.0
npm >= 6.14.0
```

### Installation
1. Clone the repository:
```bash
git clone https://github.com/yourusername/grievance-management-system.git
cd grievance-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Run the development server:
```bash
npm run dev
```

## Project Structure
```
src/
├── app/                 # Next.js app directory
│   ├── admin/          # Admin dashboard pages
│   ├── track/          # Grievance tracking pages
│   └── notifications/  # Notification pages
├── components/         # Reusable React components
├── contexts/          # React contexts
├── lib/               # Utility functions and services
├── types/            # TypeScript type definitions
└── utils/            # Helper functions
```

## Recent Updates

### Version 1.1.0
- Enhanced grievance tracking with real-time updates
- Improved admin workflow management
- Added Tamil language OCR support
- Fixed file upload and processing issues
- Improved error handling and user feedback

### Known Issues
1. Tamil OCR recognition accuracy needs improvement
2. PDF processing may fail for certain file types
3. Type errors in notification system
4. Some UI elements need optimization for mobile

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Add comments for complex logic
- Use proper naming conventions

### Database
- Use proper table joins
- Implement RLS policies
- Handle null values appropriately
- Use transactions for critical operations

### Testing
- Write unit tests for utilities
- Add integration tests for API endpoints
- Test OCR with various document types
- Verify multi-language support

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Support
For support, please open an issue in the GitHub repository or contact the development team. 