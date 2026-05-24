const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://trip-sync-smoky.vercel.app",
  "https://trip-sync-shivam-thakurs-projects-99915067.vercel.app",
  "http://localhost:3001",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

module.exports = {
  allowedOrigins,
  corsOptions,
};
