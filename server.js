// import express from 'express';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes from './src/routes/authRoutes.js';
// import bloodRoutes from './src/routes/bloodRoutes.js';

// // Load env variables first, before anything else
// dotenv.config();

// const app = express();

// // CORS: Allow configured origin(s) from env, with a sensible fallback for local dev
// const allowedOrigins = process.env.ALLOWED_ORIGINS
//     ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
//     : ['http://localhost:5173'];

// app.use(cors({
//     origin: (origin, callback) => {
//         // Allow requests with no origin (e.g. curl, Render health checks)
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error(`CORS policy: origin ${origin} not allowed`));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//     credentials: true
// }));

// app.use(express.json());

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/blood', bloodRoutes);

// // Root health check
// app.get('/', (req, res) => {
//     res.json({
//         message: 'Blood Bank API is running.',
//         status: 'OK',
//         endpoints: ['/api/auth', '/api/blood']
//     });
// });

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import bloodRoutes from './src/routes/bloodRoutes.js';
// Import your pool from db.js
import pool from './src/config/db.js'; 

// Load env variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy: origin ${origin} not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blood', bloodRoutes);

// Root health check
app.get('/', (req, res) => {
    res.json({
        message: 'Blood Bank API is running.',
        status: 'OK',
        endpoints: ['/api/auth', '/api/blood']
    });
});

// Database Connection Test
pool.getConnection()
  .then(connection => {
    console.log("✅ Successfully connected to the database!");
    connection.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));