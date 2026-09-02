const legacyConfig = {
  url: 'https://jbrjsvkdnyzptkxnflbe.supabase.co',
  anonKey: 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1',
};

const config = {
  url: import.meta.env.VITE_SUPABASE_URL || legacyConfig.url,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || legacyConfig.anonKey,
};

const fallbackProfiles = {
  brian: {
    name: 'BrianBarber', slug: 'brian', category: 'Barbería', headline: 'Tu estilo, bien cuidado.',
    description: 'Cortes y barba con atención personalizada para que salgas sintiéndote vos mismo.',
    location: 'Atendido por Brian Melgar · Cuenca 2838 · WhatsApp: +54 9 11 3356-2753', accent: '#214b42', slot_minutes: 30,
    services: [{ id: 'corte', name: 'Corte', price: 15000, description: 'Corte personalizado de 30 minutos.' }, { id: 'corte-y-barba', name: 'Corte y barba', price: 18000, description: 'Corte y arreglo de barba en una sesión.' }, { id: 'barba', name: 'Barba', price: 8000, description: 'Perfilado y arreglo de barba.' }],
  },
  mirelle: {
    name: 'Mirelle', slug: 'mirelle', locale: 'pt-BR', category: 'Psicóloga', headline: 'Um espaço seguro para se escutar.',
    description: 'Psicoterapia com escuta atenta, acolhimento e respeito ao seu tempo.', location: 'Atendimento online e presencial', accent: '#5d4b7b', slot_minutes: 50, currency: 'BRL', services: [],
  },
  sardi: {
    name: 'Sardi Estudio', slug: 'sardi', category: 'Abogado · Asesor inmobiliario', headline: 'Asesoramiento jurídico e inmobiliario con mirada estratégica.',
    description: 'Sardi Estudio acompaña consultas y gestiones con atención personalizada, claridad y compromiso profesional.', location: 'Chivilcoy 1441, CABA · Gestiones judiciales en Buenos Aires y Mendoza', accent: '#273a5f', slot_minutes: 60,
    contact_whatsapp: '5491156166994', contact_email: 'sea.abogado@gmail.com', instagram: 'https://www.instagram.com/sardi.estudiojuridico/', reservation_amount: 1,
    services: [{ id: 'consulta', name: 'Consulta', price: 15000, description: 'Consulta jurídica e inmobiliaria personalizada.' }],
  },
  miro: {
    name: 'Óptica Miró', slug: 'miro', category: 'Óptica', locale: 'es-AR',
    headline: 'Cuidamos tu mirada con atención personalizada.',
    description: 'Consulta óptica individual para evaluar tu visión y orientarte en la elección de tus lentes.',
    location: 'Av. Francisco Beiró 3268 · Villa del Parque, CABA', accent: '#c51f24', slot_minutes: 30,
    booking_without_payment: true, contact_whatsapp: '5491166046476', contact_email: 'miro@induliru.com',
    services: [{ id: 'consulta-optica', name: 'Consulta óptica', price: 5000, description: 'Evaluación y asesoramiento óptico personalizado.' }],
  },
};

function functionUrl(name) {
  return `${config.url.replace(/\/$/, '')}/functions/v1/${name}`;
}

async function request(name, options = {}) {
  let lastError;
  // Edge functions may have a transient cold start, especially for visitors
  // outside Argentina. Retrying public requests prevents a false “not found”.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(functionUrl(name), {
        ...options,
        headers: { apikey: config.anonKey, 'Content-Type': 'application/json', ...options.headers },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) return payload;
      if (response.status < 500) {
        const clientError = new Error(payload.error || 'No se pudo completar la operación.');
        clientError.noRetry = true;
        throw clientError;
      }
      lastError = new Error(payload.error || 'No se pudo completar la operación.');
    } catch (error) {
      lastError = error;
      if (error?.noRetry) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  throw lastError || new Error('No se pudo completar la operación.');
}

export async function getBusiness(slug) {
  const fallback = fallbackProfiles[slug];
  const cacheKey = `induliru-business-${slug}`;
  try {
    const data = await request(`public-business?slug=${encodeURIComponent(slug)}`);
    const business = { ...fallback, ...data.business, slug, services: Array.isArray(data.business.services) ? data.business.services : (fallback?.services || []) };
    localStorage.setItem(cacheKey, JSON.stringify(business));
    return business;
  } catch (error) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) return { ...fallback, ...JSON.parse(cached), slug };
    } catch { /* A corrupt cache is safely ignored. */ }
    if (fallback) return fallback;
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

export function createBooking(payload) {
  return request('create-booking', { method: 'POST', body: JSON.stringify(payload) });
}

export function findAppointment(slug, dni) {
  return request(`appointment?business=${encodeURIComponent(slug)}&dni=${encodeURIComponent(dni)}`);
}

export function cancelAppointment(id, dni, business_slug) {
  return request('cancel-booking', { method: 'POST', body: JSON.stringify({ id, dni, business_slug }) });
}
