import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { cancelAppointment, createPreference, findAppointment, getAvailability, getAvailabilityMonth, getBusiness } from './api';

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
const formatPrice = (price) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(price));
function InduliruHeader() { return <header className="global-header"><div className="global-header-inner"><a href="/" className="global-brand"><img src="/LOGO.png" alt="Logo de Induliru" />INDULIRU</a><nav className="global-menu"><a href="/#nosotros">Nosotros</a><a href="/#servicios">Servicios</a><Link to="/">Turnos</Link><a href="/#contacto">Contacto</a></nav></div></header>; }
const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
function InlineCalendar({ month, availableDates, selectedDate, onSelect, onMonthChange, loading }) {
  const [year, monthIndex] = month.split('-').map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const days = new Date(year, monthIndex, 0).getDate();
  const available = new Set(availableDates);
  const label = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex - 1, 1));
  const cells = Array.from({ length: mondayOffset + days }, (_, index) => index < mondayOffset ? null : index - mondayOffset + 1);
  const shift = (amount) => { const next = new Date(year, monthIndex - 1 + amount, 1); onMonthChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`); };
  return <div className="inline-calendar" aria-label="Elegí una fecha disponible"><div className="inline-calendar-head"><button type="button" onClick={() => shift(-1)} aria-label="Mes anterior">←</button><strong>{label.charAt(0).toUpperCase()}{label.slice(1)}</strong><button type="button" onClick={() => shift(1)} aria-label="Mes siguiente">→</button></div><div className="inline-calendar-weekdays">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="inline-calendar-grid">{cells.map((day, index) => day === null ? <span key={`blank-${index}`} /> : (() => { const value = dateKey(year, monthIndex - 1, day); const enabled = value >= today && available.has(value); return <button type="button" key={value} disabled={!enabled || loading} className={value === selectedDate ? 'selected' : ''} onClick={() => onSelect(value)}>{day}</button>; })())}</div>{loading && <p className="calendar-loading">Buscando fechas disponibles…</p>}<p className="calendar-help-text">Elegí una fecha resaltada para ver sus horarios.</p></div>;
}

function Home() {
  return <main className="platform">
    <InduliruHeader />
    <section className="platform-hero">
      <div><span className="eyebrow">INDULIRU · TURNOS</span><h1>Tu agenda online.<br /><em>Lista para vender.</em></h1><p>Una página profesional para que tus clientes elijan servicio, horario y paguen su reserva desde el celular.</p><div className="platform-actions"><a className="button" href="https://wa.me/5491172657749?text=Hola%2C%20quiero%20mi%20plataforma%20de%20turnos%20Induliru." target="_blank" rel="noreferrer">Quiero mi plataforma</a><Link className="text-link" to="/brian">Ver BrianBarber en vivo →</Link></div></div>
      <aside className="offer-card"><span>LANZAMIENTO</span><strong>$100.000</strong><p>Pago único</p><hr /><b>5 años sin costo de plataforma</b><small>Sin cuotas mensuales. Mercado Pago cobra sus comisiones habituales.</small></aside>
    </section>
    <section className="platform-proof"><p>Todo lo que necesitás para ordenar tus turnos y dar una imagen profesional desde el primer día.</p><div><span>Reservas 24/7</span><span>Pago online</span><span>Agenda editable</span></div></section>
    <section className="how-it-works"><div className="section-heading"><span className="eyebrow">ASÍ DE SIMPLE</span><h2>Vos atendés.<br />La plataforma ordena.</h2></div><ol><li><span>01</span><div><h3>Nos pasás tu información</h3><p>Servicios, precios, horarios, fotos y datos de contacto.</p></div></li><li><span>02</span><div><h3>Generás tu link de Mercado Pago</h3><p>Con un link de cobro de Mercado Pago ya podés recibir reservas pagas.</p></div></li><li><span>03</span><div><h3>Publicamos tu página</h3><p>Recibís una web con agenda online para compartir por WhatsApp, Instagram o Google.</p></div></li></ol></section>
    <section className="tutorial"><div className="section-heading"><span className="eyebrow">CONFIGURACIÓN SIMPLE</span><h2>Así se pone en marcha.</h2><p>El único paso técnico que necesitás hacer es crear tu link de Mercado Pago. Del resto nos ocupamos nosotros.</p></div><div className="payment-preview" aria-label="Ejemplo de un link de pago de Mercado Pago"><img className="payment-logo" src="/turnos/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" /><span>EJEMPLO DE LINK DE PAGO</span><h3>Compartí tu link<br />para cobrar</h3><strong>$5.000</strong><label>Link de pago</label><p>https://mpago.la/tu-link</p><div className="payment-copy-button"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.004 5.996h-1.252V4.745a2.754 2.754 0 0 0-2.751-2.751H4.997a2.754 2.754 0 0 0-2.751 2.751v10.004A2.754 2.754 0 0 0 4.997 17.5h1.251v1.252a2.753 2.753 0 0 0 2.75 2.75h10.006a2.753 2.753 0 0 0 2.75-2.75V8.746a2.753 2.753 0 0 0-2.75-2.75ZM4.997 16a1.252 1.252 0 0 1-1.251-1.251V4.745c0-.69.561-1.251 1.251-1.251h10.004c.689 0 1.251.561 1.251 1.251v1.251H8.998a2.753 2.753 0 0 0-2.75 2.75V16H4.997Zm15.257 2.752c0 .689-.561 1.25-1.25 1.25H8.998a1.252 1.252 0 0 1-1.25-1.25V8.746c0-.689.561-1.25 1.25-1.25h10.006c.689 0 1.25.561 1.25 1.25v10.006Z" /></svg><span>Copiar link</span></div><small>El tutorial completo llega por email al iniciar tu plataforma.</small></div></section>
    <section className="testimonials"><span className="eyebrow">CLIENTES FELICES</span><h2>Negocios reales,<br />menos vueltas.</h2><div className="testimonial-grid"><figure><blockquote>“La aplicación anda genial. Mis clientes ya pueden elegir su horario sin escribirme a cada rato.”</blockquote><figcaption><strong>Brian</strong><span>BrianBarber</span></figcaption></figure><figure><blockquote>“Desde que la uso aumentaron mis clientes de masajes. Reservar se volvió mucho más fácil.”</blockquote><figcaption><strong>Antonella</strong><span>Masajista profesional</span></figcaption></figure></div></section>
    <section className="terms" id="terminos"><span className="eyebrow">CONDICIONES COMERCIALES</span><h2>Claro desde el inicio.</h2><p>El pago único de $100.000 incluye la configuración inicial y el uso de la plataforma de turnos por cinco años, sin abono mensual de plataforma. Las comisiones de Mercado Pago y servicios externos contratados por el negocio se cobran por separado. La personalización se realiza sobre la plantilla de Induliru y está sujeta a la información provista por cada profesional.</p><a className="text-link" href="mailto:hola@induliru.com?subject=Consulta%20sobre%20turnos%20Induliru">Consultar condiciones completas →</a></section>
    <SiteFooter />
  </main>;
}

function BookingPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', dni: '', service: '', date: '', time: '' });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today.slice(0, 7));
  const [availableDates, setAvailableDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupDni, setLookupDni] = useState('');
  const [appointment, setAppointment] = useState();
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    setBusiness(undefined); setError(''); setForm({ name: '', dni: '', service: '', date: '', time: '' }); setSlots([]);
    getBusiness(slug).then(setBusiness).catch((err) => setError(err.message));
  }, [slug]);

  useEffect(() => {
    let active = true;
    setLoadingDates(true);
    getAvailabilityMonth(slug, calendarMonth).then((result) => { if (active) setAvailableDates(result.available_dates || []); }).catch((err) => { if (active) setError(err.message); }).finally(() => { if (active) setLoadingDates(false); });
    return () => { active = false; };
  }, [slug, calendarMonth]);

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
  const paymentParams = new URLSearchParams(window.location.search);
  const paymentStatus = paymentParams.get('payment_status');
  const paymentDate = paymentParams.get('booking_date');
  const paymentTime = paymentParams.get('booking_time');
  const paymentId = paymentParams.get('payment_id') || paymentParams.get('collection_id');
  const paymentWhen = paymentDate ? `${new Date(`${paymentDate}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}${paymentTime ? ` a las ${paymentTime} hs` : ''}` : 'la fecha seleccionada';
  const paymentWhatsapp = `https://wa.me/5491154907428?text=${encodeURIComponent(`Hola, acabo de pagar una reserva para ${paymentWhen}.${paymentId ? ` Número de pago: ${paymentId}.` : ''}`)}`;

  return <main className="site" style={{ '--accent': business.accent }}>
    <InduliruHeader />
    {paymentStatus && <div className={`notice ${paymentStatus === 'approved' ? 'success' : ''}`}>{paymentStatus === 'approved' ? <><span>Tu pago fue recibido. Te confirmaremos el turno a la brevedad.</span><a className="payment-whatsapp" href={paymentWhatsapp} target="_blank" rel="noreferrer">WhatsApp <span>↗</span></a></> : 'El pago quedó pendiente. Podés intentarlo nuevamente cuando quieras.'}</div>}
    <section className="hero-panel"><div><span className="eyebrow">{business.category}</span><h1>{business.name}</h1><p>{business.headline}</p><a className="hero-cta" href="#reserva">Quiero un turno <span>→</span></a><div className="hero-meta">{business.location} <span>·</span> Reservá online en minutos</div></div><div className="hero-orb" aria-hidden="true">✦</div></section>
    <section className="intro"><p>{business.description}</p><div className="trust"><span>Atención personalizada</span><span>Pago seguro</span><span>Confirmación online</span></div></section>
    <section className="services" aria-labelledby="services-title"><div className="section-heading"><span className="eyebrow">SERVICIOS</span><h2>Elegí tu próximo look.</h2></div><div className="service-grid">{business.services.map((service) => <article className="service-card" key={service.id}><h3>{service.name}</h3><p>{service.description}</p><strong>{formatPrice(service.price)}</strong><button onClick={() => { setForm((current) => ({ ...current, service: service.id })); document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' }); }}>Elegir servicio <span>→</span></button></article>)}</div></section>
    <section className="booking-section" id="reserva"><div className="section-heading"><span className="eyebrow">RESERVÁ TU TURNO</span><h2>Pedí un turno.</h2></div><form className="booking-card" onSubmit={submit}><label>Nombre y apellido<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. María Fernández" /></label><label>DNI<input required inputMode="numeric" maxLength="8" value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder="Sin puntos" /></label><label>Servicio<select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option value="">Elegí un servicio</option>{business.services.map((item) => <option value={item.id} key={item.id}>{item.name} — {formatPrice(item.price)}</option>)}</select></label><fieldset><legend>Fecha</legend><InlineCalendar month={calendarMonth} availableDates={availableDates} selectedDate={form.date} onSelect={selectDate} onMonthChange={setCalendarMonth} loading={loadingDates} /></fieldset><fieldset><legend>Horario</legend>{!form.date && <p className="muted">Elegí una fecha disponible en el calendario.</p>}{loadingSlots && <p className="muted">Buscando horarios…</p>}{form.date && !loadingSlots && slots.length === 0 && <p className="muted">No hay horarios disponibles para ese día.</p>}<div className="slots">{slots.map((slot) => <button type="button" className={form.time === slot ? 'selected' : ''} key={slot} onClick={() => setForm({ ...form, time: slot })}>{slot}</button>)}</div></fieldset>{error && <p className="form-error" role="alert">{error}</p>}<button className="button submit" disabled={saving || !form.time}>{saving ? 'Redirigiendo al pago…' : 'Continuar al pago'}</button><p className="payment-copy"><img src="/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" />Pago seguro procesado por Mercado Pago.</p></form></section>
    <section className="lookup"><div><span className="eyebrow">¿YA TENÉS TURNO?</span><h2>Consultalo o cancelalo.</h2></div><form onSubmit={searchAppointment}><label>DNI<input inputMode="numeric" maxLength="8" value={lookupDni} onChange={(e) => setLookupDni(e.target.value.replace(/\D/g, ''))} placeholder="Ingresá tu DNI" required /></label><button className="button outline">Ver mi turno</button></form>{lookupError && <p className="form-error">{lookupError}</p>}{appointment === null && <p className="muted">No encontramos un turno activo con ese DNI.</p>}{appointment && <div className="appointment"><strong>{appointment.name}</strong><span>{business.services.find((item) => item.id === appointment.service)?.name || appointment.service}</span><span>{new Date(`${appointment.booking_date}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.booking_time.slice(0, 5)} hs</span>{appointment.status === 'cancelled' ? <em>Turno cancelado</em> : <button onClick={cancel}>Cancelar turno</button>}</div>}</section>
    <SiteFooter />
  </main>;
}

function SiteFooter() { return <footer className="site-footer"><p className="footer-copy">© 2026 <b>Induliru</b>. Innovación | Calidad | Desarrollo. Todos los derechos reservados.</p><div className="footer-links"><a href="https://wa.me/5491172657749" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="WhatsApp" />+54 9 11 7265-7749</a><a href="https://www.instagram.com/induliru.tech/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="Instagram" />@induliru.tech</a><a href="mailto:hola@induliru.com"><img src="/turnos/GMAIL_LOGO.png" alt="Email" />hola@induliru.com</a></div></footer>; }

function Status({ title, detail }) { return <main className="directory"><span className="eyebrow">INDULIRU · TURNOS</span><h1>{title}</h1>{detail && <p>{detail}</p>}<Link className="button" to="/">Ir al inicio</Link></main>; }
function PanelRedirect({ to }) { useEffect(() => { window.location.replace(`${to}${window.location.search}`); }, [to]); return <Status title="Abriendo el panel…" />; }

export default function App() { return <Routes><Route path="/" element={<Home />} /><Route path="/admin" element={<PanelRedirect to="https://gadielma.github.io/turnos/admin/" />} /><Route path="/adminadmin" element={<PanelRedirect to="https://gadielma.github.io/turnos/adminadmin/" />} /><Route path="/:slug" element={<BookingPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }
