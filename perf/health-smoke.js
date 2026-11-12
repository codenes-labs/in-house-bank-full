import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL ?? 'http://localhost:5173';

export const options = {
  vus: 2,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/health`);
  check(response, {
    'status 200': (r) => r.status === 200,
    'configured field present': (r) => {
      try {
        const body = r.json();
        return typeof body.configured === 'boolean';
      } catch {
        return false;
      }
    },
  });
}
