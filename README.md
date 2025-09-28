# AutoPrint - Automated Printing Management System

A comprehensive printing management system with multiple components for different user interfaces and hardware integration.

## Project Structure

```
AutoPrint/
├── backend/                 # Node.js + Express + Sequelize API server
├── admin-dashboard/         # React admin interface
├── student-web/            # React student portal
├── raspi-agent/            # Python Raspberry Pi agent
├── esp32-kiosk/            # PlatformIO/Arduino ESP32 kiosk
├── infra/                  # Docker compose and infrastructure
└── docs/                   # Documentation
```

## Components Overview

- **Backend**: REST API server handling authentication, file management, payment processing, and print job orchestration
- **Admin Dashboard**: React-based admin interface for managing users, monitoring print jobs, and system configuration
- **Student Web**: React-based student portal for document upload, payment, and print job tracking
- **Raspberry Pi Agent**: Python service running on RPi to manage physical printers and job processing
- **ESP32 Kiosk**: Arduino-based kiosk interface for on-site printing requests
- **Infrastructure**: Docker containers, database, and deployment configurations

## Quick Start

1. **Prerequisites**
   ```bash
   # Install Node.js 18+, Python 3.9+, Docker, and PlatformIO
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Infrastructure**
   ```bash
   cd infra
   docker-compose up -d
   ```

4. **Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

5. **Start Frontend Components**
   ```bash
   # Admin Dashboard
   cd admin-dashboard
   npm install
   npm start

   # Student Web
   cd student-web
   npm install
   npm start
   ```

## Development with GitHub Copilot

Each component is structured to work seamlessly with GitHub Copilot:

### Backend Development
- Use Copilot to expand API endpoints: Comment your desired functionality
- Generate Sequelize models and migrations
- Create middleware for authentication, validation, and error handling
- Implement payment gateway integrations

### Frontend Development
- Generate React components with Copilot chat
- Create forms, tables, and dashboards
- Implement state management (Redux/Context)
- Add responsive UI with Material-UI or Tailwind CSS

### Python Agent Development
- Use Copilot to create printer drivers and communication protocols
- Implement file processing and print queue management
- Add hardware monitoring and error handling

### ESP32 Development
- Generate Arduino code for LCD displays, buttons, and sensors
- Implement WiFi communication and API integration
- Create user interface flows and error handling

## Architecture

```
[Student Web] ──┐
                ├── [Backend API] ── [PostgreSQL]
[Admin Dashboard] ──┘       │
                            ├── [S3 Storage]
[ESP32 Kiosk] ──────────────┤
                            │
[Raspberry Pi Agent] ───────┴── [Physical Printers]
```

## Contributing

1. Choose a component to work on
2. Use GitHub Copilot to understand existing code patterns
3. Implement features incrementally
4. Test thoroughly before committing
5. Update documentation as needed

## License

MIT License - see LICENSE file for details