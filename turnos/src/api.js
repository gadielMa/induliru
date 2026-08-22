const legacyConfig = {
  url: 'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  anonKey: 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
};

const config = {
  url: import.meta.env.VITE_SUPABASE_URL || legacyConfig.url,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.anonKey,
};

const fallbackProfile = {
  name: 'Antonella Morselli',
  slug: 'antonella-morselli',
  category: 'Masajista profesional',
  headline: 'Un espacio para volver a sentirte bien.',
  description: 'Sesiones personalizadas para aliviar tensiones, recuperar movilidad y regalarte un momento de bienestar.',
  location: 'Villa Devoto, CABA',
  accent: '#3f6659',
  services: [
    { id: 'descontracturante', name: 'Masaje descontracturante', price: '$30.000', description: 'Para aliviar dolores y contracturas musculares.' },
    { id: 'relajante', name: 'Masaje relajante', price: '$25.000', description: 'Una pausa profunda para cuerpo y mente.' },
    { id: 'deportivo', name: 'Masaje deportivo', price: '$35.000', description: 'Recuperación y prevención para una vida en movimiento.' },
  ],
};

function functionUrl(name) {
  return `${config.url.replace(/\/$/, '')}/functions/v1/${name}`;
}

async function request(name, options = {}) {
  const response = await fetch(functionUrl(name), {
    ...options,
    headers: {
      apikey: config.anonKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No se pudo completar la operación.');
  return payload;
}

export async function getBusiness(slug) {
  try {
    const data = await request(`public-business?slug=${encodeURIComponent(slug)}`);
    return { ...fallbackProfile, ...data.business, slug, services: data.business.services?.length ? data.business.services : fallbackProfile.services };
  } catch (error) {
    if (slug === fallbackProfile.slug) return fallbackProfile;
    throw error;
  }
}

export function getAvailability(slug, date) {
  return request(`availability?business=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`);
}

export function createPreference(payload) {
  return request('create-preference', { method: 'POST', body: JSON.stringify(payload) });
}

export function findAppointment(slug, dni) {
  return request(`appointment?business=${encodeURIComponent(slug)}&dni=${encodeURIComponent(dni)}`);
}

export function cancelAppointment(id, dni, business_slug) {
  return request('cancel-booking', { method: 'POST', body: JSON.stringify({ id, dni, business_slug }) });
}

