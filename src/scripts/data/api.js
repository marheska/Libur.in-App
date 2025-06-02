const BASE_URL = 'https://story-api.dicoding.dev/v1';

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  STORIES: `${BASE_URL}/stories`,
};

async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });
  return response.json();
}

async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.json(); // hasil: { loginResult: { token, name, userId }, message }
}

async function getStories(token) {
  const response = await fetch(ENDPOINTS.STORIES, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  return data.listStory.map(story => ({
    id: story.id,
    title: story.name,
    description: story.description,
    image: story.photoUrl,
    date: new Date(story.createdAt).toLocaleString(),
    location: {
      latitude: story.lat,
      longitude: story.lon,
    },
    reporter: { name: story.name },
  }));
}

async function postStory({ name, description, photo, lat, lon }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }

  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  formData.append('lat', lat);
  formData.append('lon', lon);

  const response = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return response.json();
}

export async function getReportById(token, id) {
  try {
    const response = await fetch(`${BASE_URL}/stories/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response || !response.ok) throw new Error('Gagal mengambil detail laporan');
    const data = await response.json();
    // Normalisasi agar field yang dilempar ke reportMapper selalu konsisten
    // API Dicoding: { story: { id, name, description, photoUrl, createdAt, lat, lon, ... } }
    if (data && data.story) {
      return {
        ...data.story,
        id: data.story.id,
        name: data.story.name,
        description: data.story.description,
        photoUrl: data.story.photoUrl,
        createdAt: data.story.createdAt,
        lat: data.story.lat,
        lon: data.story.lon,
        // Tambahan jika ada evidenceImages, damageLevel, dsb
      };
    }
    // fallback jika struktur tidak sesuai
    return data;
  } catch (error) {
    console.error('getReportById error:', error);
    return null;
  }
}

export async function getAllCommentsByReportId(token, id) {
  // Jika API tidak support komentar, return array kosong
  return [];
}

export async function storeNewCommentByReportId(token, id, { body }) {
  try {
    const response = await fetch(`${BASE_URL}/stories/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    return {
      ok: response.ok,
      message: data.message || (response.ok ? 'Komentar berhasil ditambahkan' : 'Gagal menambah komentar'),
      data: data.data || null,
    };
  } catch (error) {
    console.error('storeNewCommentByReportId error:', error);
    return {
      ok: false,
      message: error.message || 'Gagal menambah komentar',
      data: null,
    };
  }
}

export { register, login, getStories, postStory };
