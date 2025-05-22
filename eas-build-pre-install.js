const fs = require('fs');

if (process.env.GOOGLE_SERVICES_JSON) {
  const decoded = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
  fs.writeFileSync('./android/app/google-services.json', decoded);
  console.log('✅ google-services.json generado desde variable de entorno');
} else {
  console.warn('⚠️ GOOGLE_SERVICES_JSON no está definida');
}