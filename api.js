import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
});

export async function getArticles() {
  try {
    const res = await api.get('/api/articles');
    return res.data || [];
  } catch (err) {
    console.error('getArticles error:', err?.message || err);
    return [];
  }
}
