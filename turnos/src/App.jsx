import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { cancelAppointment, createPreference, findAppointment, getAvailability, getBusiness } from './api';

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(price));

function Home() {
  return <Navigate to="/brian" replace />;
}

function BookingPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', dni: '', service: '', date: '', time: '' });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupDni, setLookupDni] = useState('');
  const [appointment, setAppointment] = useState();
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    setBusiness(undefined); setError(''); setForm({ name: '', dni: '', service: '', date: '', time: '' }); setSlots([]);
    getBusiness(slug).then(setBusiness).catch((err) => setError(err.message));
  }, [slug]);

  async function selectDate(date) {
    setForm((current) => ({ ...current, date, time: '' })); setSlots([]);
    if (!date) return;
    setLoadingSlots(true);
    try { setSlots((await getAvailability(slug, date)).available || []); }
    catch (err) { setError(err.message); }
    finally { setLoadingSlots(false); }
  }

  async function submit(event) {
    event.preventDefault(); setError('');
    if (!/^\d{7,8}$/.test(form.dni)) return setError('Ingresá un DNI válido de 7 u 8 dígitos.');
    setSaving(true);
    try {
      const result = await createPreference({ ...form, business_slug: slug });
      window.location.assign(result.init_point);
    } catch (err) { setError(err.message); setSaving(false); }
  }

  async function searchAppointment(event) {
    event.preventDefault(); setLookupError(''); setAppointment(undefined);
    try { setAppointment((await findAppointment(slug, lookupDni)).appointment); }
    catch (err) { setLookupError(err.message); }
  }

  async function cancel() {
    if (!appointment || !window.confirm('¿Querés cancelar este turno?')) return;
    try { await cancelAppointment(appointment.id, lookupDni, slug); setAppointment({ ...appointment, status: 'cancelled' }); }
    catch (err) { setLookupError(err.message); }
  }

  if (error && !business) return <Status title="No encontramos esta página" detail={error} />;
  if (!business) return <Status title="Cargando tu turno…" />;
  const paymentStatus = new URLSearchParams(window.location.search).get('payment_status');

  return <main className="site" style={{ '--accent': business.accent }}>
    <header className="topbar"><Link to="/" className="brand">INDULIRU</Link><a href="#reserva">Reservar turno</a></header>
    {paymentStatus && <div className={`notice ${paymentStatus === 'approved' ? 'success' : ''}`}>{paymentStatus === 'approved' ? 'Tu pago fue recibido. Te confirmaremos el turno a la brevedad.' : 'El pago quedó pendiente. Podés intentarlo nuevamente cuando quieras.'}</div>}
    <section className="hero-panel"><div><span className="eyebrow">{business.category}</span><h1>{business.name}</h1><p>{business.headline}</p><div className="hero-meta">{business.location} <span>·</span> Reservá online en minutos</div></div><div className="hero-orb" aria-hidden="true">✦</div></section>
    <section className="intro"><p>{business.description}</p><div className="trust"><span>Atención personalizada</span><span>Pago seguro</span><span>Confirmación online</span></div></section>
    <section className="services" aria-labelledby="services-title"><div className="section-heading"><span className="eyebrow">SERVICIOS</span><h2>Elegí tu próximo look.</h2></div><div className="service-grid">{business.services.map((service) => <article className="service-card" key={service.id}><h3>{service.name}</h3><p>{service.description}</p><strong>{formatPrice(service.price)}</strong><button onClick={() => { setForm((current) => ({ ...current, service: service.id })); document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' }); }}>Elegir servicio <span>→</span></button></article>)}</div></section>
    <section className="booking-section" id="reserva"><div className="section-heading"><span className="eyebrow">RESERVÁ TU TURNO</span><h2>Tu próximo look empieza acá.</h2><p>Seleccioná el servicio, fecha y horario que mejor te quede.</p></div><form className="booking-card" onSubmit={submit}><label>Nombre y apellido<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. María Fernández" /></label><label>DNI<input required inputMode="numeric" maxLength="8" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder="Sin puntos" /></label><label>Servicio<select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option value="">Elegí un servicio</option>{business.services.map((item) => <option value={item.id} key={item.id}>{item.name} — {formatPrice(item.price)}</option>)}</select></label><label>Fecha<input required type="date" min={today} value={form.date} onChange={(e) => selectDate(e.target.value)} /></label><fieldset><legend>Horario</legend>{!form.date && <p className="muted">Primero elegí una fecha.</p>}{loadingSlots && <p className="muted">Buscando horarios…</p>}{form.date && !loadingSlots && slots.length === 0 && <p className="muted">No hay horarios disponibles para ese día.</p>}<div className="slots">{slots.map((slot) => <button type="button" className={form.time === slot ? 'selected' : ''} key={slot} onClick={() => setForm({ ...form, time: slot })}>{slot}</button>)}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button submit" disabled={saving || !form.time}>{saving ? 'Redirigiendo al pago…' : 'Continuar al pago'}</button><p className="payment-copy">Pago seguro procesado por Mercado Pago.</p></form></section>
    <section className="lookup"><div><span className="eyebrow">¿YA TENÉS TURNO?</span><h2>Consultalo o cancelalo.</h2></div><form onSubmit={searchAppointment}><label>DNI<input inputMode="numeric" maxLength="8" value={lookupDni} onChange={(e) => setLookupDni(e.target.value.replace(/\D/g, ''))} placeholder="Ingresá tu DNI" required /></label><button className="button outline">Ver mi turno</button></form>{lookupError && <p className="form-error">{lookupError}</p>}{appointment === null && <p className="muted">No encontramos un turno activo con ese DNI.</p>}{appointment && <div className="appointment"><strong>{appointment.name}</strong><span>{business.services.find((item) => item.id === appointment.service)?.name || appointment.service}</span><span>{new Date(`${appointment.booking_date}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.booking_time.slice(0, 5)} hs</span>{appointment.status === 'cancelled' ? <em>Turno cancelado</em> : <button onClick={cancel}>Cancelar turno</button>}</div>}</section>
    <footer>Hecho con <strong>Induliru</strong> · Reservas online para profesionales independientes.</footer>
  </main>;
}

function Status({ title, detail }) { return <main className="directory"><span className="eyebrow">INDULIRU · TURNOS</span><h1>{title}</h1>{detail && <p>{detail}</p>}<Link className="button" to="/">Ir al inicio</Link></main>; }

export default function App() { return <Routes><Route path="/" element={<Home />} /><Route path="/:slug" element={<BookingPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }

