const legacyConfig = {
  url: 'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  anonKey: 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
};

const config = {
  url: import.meta.env.VITE_SUPABASE_URL || legacyConfig.url,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.anonKey,
};

const fallbackProfile = {
  name: 'BrianBarber',
  slug: 'brian',
  category: 'Barbería',
  headline: 'Tu estilo, bien cuidado.',
  description: 'Cortes y barba con atención personalizada para que salgas sintiéndote vos mismo.',
  location: 'Atendido por Brian Melgar · Cuenca 2838 · WhatsApp: +54 9 11 3356-2753',
  accent: '#214b42',
  services: [
    { id: 'corte', name: 'Corte', price: 15000, description: 'Corte personalizado de 30 minutos.' },
    { id: 'corte-y-barba', name: 'Corte y barba', price: 18000, description: 'Corte y arreglo de barba en una sesión.' },
    { id: 'barba', name: 'Barba', price: 8000, description: 'Perfilado y arreglo de barba.' },
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
    const fallback = slug === fallbackProfile.slug ? fallbackProfile : {};
    return { ...fallback, ...data.business, slug, services: Array.isArray(data.business.services) ? data.business.services : (fallback.services || []) };
  } catch (error) {
    if (slug === fallbackProfile.slug) return fallbackProfile;
    throw error;
  }
}

export function getAvailability(slug, date) {
  return request(`availability?business=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`);
}

export function getAvailabilityMonth(slug, month) {
  return request(`availability?business=${encodeURIComponent(slug)}&month=${encodeURIComponent(month)}`);
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
