# InsightForge: MERN MVC Project with Tailwind CSS v4

A modern boilerplate for a MERN stack application structured using the MVC (Model-View-Controller) design pattern on the backend, styled with Tailwind CSS v4 on the frontend.

## Folder Structure

```
ThesisSphere/
├── package.json                 # Root package.json to manage both client and server
├── README.md                    # Project documentation
├── backend/                     # Node.js + Express + MongoDB (MVC Pattern)
│   ├── config/                  # Configuration files (DB connection, environment variables)
│   │   └── db.js
│   ├── controllers/             # Controller logic (handles requests and returns responses)
│   │   └── userController.js
│   ├── models/                  # Database schemas/models (Mongoose)
│   │   └── userModel.js
│   ├── routes/                  # Express routes mapping URL endpoints to controllers
│   │   └── userRoutes.js
│   ├── middleware/              # Custom middleware (error handling, auth, logger)
│   │   ├── authMiddleware.js
│   │   └── errorMiddleware.js
│   ├── utils/                   # Helper functions/utilities
│   ├── .env.example             # Example environment variables
│   ├── server.js                # Entry point for backend server
│   └── package.json             # Backend dependencies & scripts
└── frontend/                    # React Client (Vite + Tailwind CSS v4)
    ├── public/
    ├── src/
    │   ├── assets/              # Static assets
    │   ├── components/          # Reusable UI components
    │   ├── context/             # React Context for state management
    │   ├── hooks/               # Custom React hooks
    │   ├── pages/               # Page components representing views
    │   ├── services/            # API call services
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css            # Tailwind directives import location
    │   └── main.jsx
    ├── index.html
    ├── package.json             # Frontend dependencies (React, Vite, @tailwindcss/vite, tailwindcss)
    └── vite.config.js           # Vite configuration with @tailwindcss/vite plugin & proxy
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string

### Setup & Installation
1. Clone or initialize the repository.
2. Install all dependencies for root, backend, and frontend with a single command:
   ```bash
   npm run install-all
   ```

3. Create the backend configuration environment:
   Copy `/backend/.env.example` to `/backend/.env` and update the values:
   ```bash
   cp backend/.env.example backend/.env
   ```

4. Run the project in development mode:
   ```bash
   npm run dev
   ```
   This will run both the frontend and backend servers concurrently.
