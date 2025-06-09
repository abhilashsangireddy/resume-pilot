# Resume Pilot

A modern web application for managing and creating resumes using AI-powered tools and LaTeX templates.

## Features

- User authentication and authorization
- File management system with GridFS storage
- Resume template management
- AI-powered resume enhancement
- LaTeX-based resume generation
- Tag-based organization

## Tech Stack

- Backend: NestJS with TypeScript
- Database: MongoDB with GridFS
- Frontend: HTML5, CSS3, JavaScript
- Authentication: JWT
- File Storage: GridFS
- Template System: LaTeX

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- LaTeX distribution (for template compilation)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/resume-pilot-app.git
cd resume-pilot-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/resume-pilot
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
CORS_ORIGIN=*
```

4. Start the development server:
```bash
npm run start:dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
resume-pilot-app/
├── src/
│   ├── auth/         # Authentication module
│   ├── files/        # File management module
│   ├── templates/    # Resume templates module
│   ├── users/        # User management module
│   └── app.module.ts # Main application module
├── public/           # Static frontend files
├── templates/        # LaTeX templates
└── uploads/         # Temporary upload directory
```

## API Documentation

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login

### Files
- POST `/api/files/upload` - Upload file
- GET `/api/files` - List user's files
- GET `/api/files/:id/download` - Download file
- DELETE `/api/files/:id` - Delete file

### Templates
- GET `/api/templates` - List available templates
- GET `/api/templates/:id` - Get template details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
