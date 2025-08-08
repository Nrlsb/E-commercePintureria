// backend-pintureria/tests/k6-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

// --- Configuración de la Prueba de Carga ---
export const options = {
  // Define las etapas de la prueba para simular un aumento gradual de tráfico.
  stages: [
    { duration: '30s', target: 20 }, // 1. Rampa de subida: de 0 a 20 usuarios en 30 segundos.
    { duration: '1m', target: 20 },  // 2. Carga sostenida: mantiene 20 usuarios durante 1 minuto.
    { duration: '10s', target: 0 },  // 3. Rampa de bajada: de 20 a 0 usuarios en 10 segundos.
  ],
  // Define los umbrales de rendimiento. Si no se cumplen, la prueba fallará.
  thresholds: {
    'http_req_duration': ['p(95)<500'], // El 95% de las peticiones deben tardar menos de 500ms.
  },
};

const BASE_URL = 'http://localhost:5001'; // URL de tu backend local

// --- Escenario de Prueba Principal ---
export default function () {
  // 1. Simular visita a la página principal de productos
  const productsRes = http.get(`${BASE_URL}/api/products`);
  check(productsRes, {
    'GET /api/products status was 200': (r) => r.status === 200,
  });

  // Pausa de 1 a 3 segundos para simular el tiempo que un usuario pasa navegando
  sleep(Math.random() * 2 + 1);

  // 2. Simular visita a una página de detalle de producto aleatoria
  const productId = Math.floor(Math.random() * 100) + 1; // Simula un ID de producto entre 1 y 100
  const productDetailRes = http.get(`${BASE_URL}/api/products/${productId}`);
  check(productDetailRes, {
    'GET /api/products/:id status was 200 or 404': (r) => [200, 404].includes(r.status),
  });

  // Pausa final antes de que el "usuario virtual" termine su sesión
  sleep(1);
}
