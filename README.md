# Practica 2025 - Refactored

A clean, modular web application with user authentication and real-time chat functionality.

## Project Structure

```
/
├── server.js              # Main server entry point (clean, modular)
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── index.html             # Login page
├── welcome.html           # Welcome/chat page
├── src/
│   ├── input.css          # Tailwind CSS input
│   └── server/            # Server modules
│       ├── config.js      # Configuration constants
│       ├── auth.js        # Authentication utilities
│       ├── websocket.js   # WebSocket manager
│       └── handlers.js    # Request handlers
│       └── handlers.js    # Request handlers
└── dist/
    ├── output.css         # Compiled CSS
    └── js/
        ├── auth.js        # Client-side authentication
        └── chat.js        # Client-side chat functionality
```

## Features

- **Clean Architecture**: Modular server structure with separation of concerns
- **No Console Logs**: Removed debugging console.log statements for production readiness
- **External JavaScript**: Moved inline scripts to separate files for better maintainability
- **Error Handling**: Graceful error handling without exposing internals
- **Security**: JWT-based authentication with input validation
- **Real-time Chat**: WebSocket-based messaging system

## Scripts

- `npm start` - Run the clean, refactored server
- `npm run build` - Build and watch Tailwind CSS

## Improvements Made

1. **Server Refactoring**:

   - Extracted configuration to separate module
   - Created dedicated auth utilities
   - Implemented WebSocket manager class
   - Organized request handlers
   - Removed all console.log statements

2. **Client-side Refactoring**:

   - Created modular JavaScript classes
   - Separated auth and chat functionality
   - Improved error handling
   - Added input sanitization
   - Removed debugging logs

3. **Code Quality**:
   - Better variable naming
   - Consistent code formatting
   - Reduced code duplication
   - Improved readability
   - Added proper error boundaries

## Usage

1. Install dependencies: `npm install`
2. Build CSS: `npm run build`
3. Start server: `npm start`
4. Open browser: http://localhost:3000
