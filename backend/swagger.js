const swaggerJsdoc = require('swagger-jsdoc');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Caspstone API Documentation',
      version: '1.0.0',
      description: 'Built with Swagger'
    }
  },
  apis: ['./swagger/*.js']
});

module.exports = { swaggerSpec };
