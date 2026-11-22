// Runs before any module is imported, so ENV is built from these values.
process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.ADMIN_EMAIL = 'admin.test@example.com';
process.env.ADMIN_PASSWORD = 'correct-horse-battery-staple';
process.env.GEMINI_API_KEY = '';
process.env.RATE_LIMIT_AUTH_MAX = '1000';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_SUBMIT_MAX = '1000';
process.env.RATE_LIMIT_AI_MAX = '1000';
process.env.RATE_LIMIT_GENERAL_MAX = '100000';
