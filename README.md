# Media Vendor Insights

A React frontend with Express backend and MySQL database for managing and analyzing vendor data.

## Features

- 📊 Upload and manage Excel/CSV files
- 📈 Analytics and statistics dashboard
- 🔍 Search and filter vendor data
- 📤 Export data in multiple formats
- 🚀 Production-ready deployment

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js, Node.js
- **Database**: MySQL
- **File Processing**: ExcelJS, Multer
- **Deployment**: Docker, Azure App Service

## Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository
2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Configure your database in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=vendor_db
   ```
5. Start the development servers:
   ```bash
   # Start backend server (port 5000)
   npm run server
   
   # Start frontend dev server (port 3000)
   npm run dev
   ```

## API Endpoints

### Files
- `GET /api/files` - Get all files with optional filtering
- `GET /api/files/:id` - Get single file
- `GET /api/files/:id/data` - Get file data
- `POST /api/upload` - Manual upload
- `POST /api/upload-excel` - Excel/CSV file upload
- `PUT /api/files/:id` - Update file
- `DELETE /api/files/:id` - Delete file
- `DELETE /api/files` - Bulk delete

### Analytics
- `GET /api/stats` - Get statistics
- `GET /api/vendors` - Get all vendors
- `GET /api/export/:vendor` - Export vendor data

### Health
- `GET /api/health` - Health check

## Development

### Project Structure

```
├── src/                    # React frontend
│   ├── lib/
│   │   └── api.ts         # API client
│   └── ...
├── backend/                # Express backend
│   ├── server.js          # Main server file
│   └── uploads/           # File uploads
├── dist/                  # Built frontend
└── docker-compose.yml     # Docker setup
```

### Environment Variables

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_api_key
VITE_APP_URL=http://localhost:3000
```

#### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=vendor_db
GEMINI_API_KEY=your_api_key
APP_URL=http://localhost:3000
```

## Deployment

### Docker (Recommended)

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

This will start:
- The application on port 5000
- MySQL database on port 3306

### Azure Deployment

1. Install Azure CLI and login
2. Deploy using Azure Developer CLI:
   ```bash
   azd up
   ```

### Manual Production Deployment

1. Build the frontend:
   ```bash
   npm run build
   ```
2. Set environment variables for production
3. Start the server:
   ```bash
   NODE_ENV=production npm run server
   ```

## Scripts

- `npm run dev` - Start frontend dev server
- `npm run server` - Start backend server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run TypeScript linter

## Database Schema

The application uses a single table `file_uploads`:

```sql
CREATE TABLE file_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendor VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  data_count INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Correct',
  file_path VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC
