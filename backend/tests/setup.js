// Mock environment variables for all tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_minimum_32_characters_long';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
process.env.CLOUDINARY_CLOUD_NAME = 'test_cloud';
process.env.CLOUDINARY_API_KEY = 'test_key';
process.env.CLOUDINARY_API_SECRET = 'test_secret';
process.env.RESEND_API_KEY = 're_test_key';
process.env.FLUTTERWAVE_SECRET_KEY = 'FLWSECK_TEST-testkey';
process.env.FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK_TEST-testkey';
process.env.FLUTTERWAVE_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.FRONTEND_URL = 'http://localhost:5173';
