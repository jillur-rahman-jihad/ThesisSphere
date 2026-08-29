import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import facultyRoutes from './routes/facultyRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import studentProfileRoutes from "./routes/studentProfileRoutes.js";
import meetingRoutes from './routes/meetingRoutes.js';
import thesisPostRoutes from './routes/thesisPostRoutes.js';
import thesisBrowseRoutes from './routes/thesisBrowseRoutes.js';
import thesisApplicationRoutes from './routes/thesisApplicationRoutes.js';
import thesisGroupRoutes from "./routes/thesisGroupRoutes.js";
import supervisorGroupManagerRoutes from './routes/supervisorGroupManagerRoutes.js';

import calendarRoutes from './routes/calendarRoutes.js';
import citationRoutes from './routes/citationRoutes.js';
import forumRoutes from './routes/forumRoutes.js';
import automatedReportRoutes from './routes/automatedReportRoutes.js';
import videoMeetingRoutes from './routes/videoMeetingRoutes.js';
import initializeSocket from './config/socketHandler.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
initializeSocket(io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running smoothly'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use("/api/student-profile", studentProfileRoutes);

app.use('/api/meetings', meetingRoutes);
app.use('/api/thesis-post', thesisPostRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/thesis-browse', thesisBrowseRoutes);
app.use('/api/thesis-applications', thesisApplicationRoutes);
app.use('/api/thesis-groups', thesisGroupRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/forum', forumRoutes);

app.use('/api/automated-report', automatedReportRoutes);
app.use('/api/video-meetings', videoMeetingRoutes);
app.use('/api/supervisor-group-manager', supervisorGroupManagerRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
