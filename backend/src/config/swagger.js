const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TripSync API",
      version: "1.0.0",
      description: "TripSync Backend API Documentation"
    },
    servers: [
      {
        url: "https://trip-sync-botj.onrender.com"
      },
      {
        url: "http://localhost:5000"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },

  apis: ["./src/routes/*.js"] // route files
};

module.exports = swaggerJsdoc(options);