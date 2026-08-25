import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { cancelAppointment, createBooking, createPreference, findAppointment, getAvailability, getAvailabilityMonth, getBusiness } from './api';

const argentinaDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(new Date());
const argentinaDatePart = (type) => argentinaDateParts.find((part) => part.type === type)?.value;
const today = `${argentinaDatePart('year')}-${argentinaDatePart('month')}-${argentinaDatePart('day')}`;
const formatPrice = (price, locale = 'es-AR') => new Intl.NumberFormat(locale, { style: 'currency', currency: locale === 'pt-BR' ? 'BRL' : 'ARS', maximumFractionDigits: 0 }).format(Number(price));
const isPortuguese = (business) => business?.locale === 'pt-BR';
function InduliruHeader({ locale }) { const portuguese = locale === 'pt-BR'; return <header className="global-header"><div className="global-header-inner"><a href="/" className="global-brand"><img src="/LOGO.png" alt="Logo Induliru" />INDULIRU</a><nav className="global-menu"><a href="/#nosotros">{portuguese ? 'Sobre nós' : 'Nosotros'}</a><a href="/#servicios">{portuguese ? 'Serviços' : 'Servicios'}</a><Link to="/">{portuguese ? 'Agendamentos' : 'Turnos'}</Link><a href="/#contacto">{portuguese ? 'Contato' : 'Contacto'}</a></nav></div></header>; }
const dateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
function InlineCalendar({ month, availableDates, selectedDate, onSelect, onMonthChange, loading, locale = 'es-AR' }) {
  const [year, monthIndex] = month.split('-').map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1).getDay();
  const mondayOffset = (firstDay + 6) % 7;
  const days = new Date(year, monthIndex, 0).getDate();
  const available = new Set(availableDates);
  const portuguese = locale === 'pt-BR';
  const label = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex - 1, 1));
  const cells = Array.from({ length: mondayOffset + days }, (_, index) => index < mondayOffset ? null : index - mondayOffset + 1);
  const shift = (amount) => { const next = new Date(year, monthIndex - 1 + amount, 1); onMonthChange(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`); };
  return <div className="inline-calendar" aria-label={portuguese ? 'Escolha uma data disponível' : 'Elegí una fecha disponible'}><div className="inline-calendar-head"><button type="button" onClick={() => shift(-1)} aria-label={portuguese ? 'Mês anterior' : 'Mes anterior'}>←</button><strong>{label.charAt(0).toUpperCase()}{label.slice(1)}</strong><button type="button" onClick={() => shift(1)} aria-label={portuguese ? 'Próximo mês' : 'Mes siguiente'}>→</button></div><div className="inline-calendar-weekdays">{(portuguese ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] : ['L', 'M', 'M', 'J', 'V', 'S', 'D']).map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="inline-calendar-grid">{cells.map((day, index) => day === null ? <span key={`blank-${index}`} /> : (() => { const value = dateKey(year, monthIndex - 1, day); const enabled = value >= today && available.has(value); return <button type="button" key={value} disabled={!enabled || loading} className={value === selectedDate ? 'selected' : ''} onClick={() => onSelect(value)}>{day}</button>; })())}</div>{loading && <p className="calendar-loading">{portuguese ? 'Buscando datas disponíveis…' : 'Buscando fechas disponibles…'}</p>}<p className="calendar-help-text">{portuguese ? 'Escolha uma data destacada para ver os horários.' : 'Elegí una fecha resaltada para ver sus horarios.'}</p></div>;
}

function Home() {
  return <main className="platform">
    <InduliruHeader />
    <section className="platform-hero">
      <div><span className="eyebrow">INDULIRU · TURNOS</span><h1>Tu agenda online.<br /><em>Lista para vender.</em></h1><p>Una página profesional para que tus clientes elijan servicio, horario y paguen su reserva desde el celular.</p><div className="platform-actions"><a className="button" href="https://wa.me/5491172657749?text=Hola%2C%20quiero%20mi%20plataforma%20de%20turnos%20Induliru." target="_blank" rel="noreferrer">Quiero mi plataforma</a><Link className="text-link" to="/brian">Ver BrianBarber en vivo →</Link></div></div>
      <aside className="offer-card"><span>LANZAMIENTO</span><strong>$40.000</strong><p>Pago único</p><hr /><b>1 año de garantía</b><small>Sin cuotas mensuales. Mercado Pago cobra sus comisiones habituales.</small></aside>
    </section>
    <section className="platform-proof"><p>Todo lo que necesitás para ordenar tus turnos y dar una imagen profesional desde el primer día.</p><div><span>Reservas 24/7</span><span>Pago online</span><span>Agenda editable</span></div></section>
    <section className="how-it-works"><div className="section-heading"><span className="eyebrow">ASÍ DE SIMPLE</span><h2>Vos atendés.<br />La plataforma ordena.</h2></div><ol><li><span>01</span><div><h3>Nos pasás tu información</h3><p>Servicios, precios, horarios, fotos y datos de contacto.</p></div></li><li><span>02</span><div><h3>Generás tu link de Mercado Pago</h3><p>Con un link de cobro de Mercado Pago ya podés recibir reservas pagas.</p></div></li><li><span>03</span><div><h3>Publicamos tu página</h3><p>Recibís una web con agenda online para compartir por WhatsApp, Instagram o Google.</p></div></li></ol></section>
    <section className="tutorial"><div className="section-heading"><span className="eyebrow">CONFIGURACIÓN SIMPLE</span><h2>Así se pone en marcha.</h2><p>El único paso técnico que necesitás hacer es crear tu link de Mercado Pago. Del resto nos ocupamos nosotros.</p></div><div className="payment-preview" aria-label="Ejemplo de un link de pago de Mercado Pago"><img className="payment-logo" src="/turnos/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" /><span>EJEMPLO DE LINK DE PAGO</span><h3>Compartí tu link<br />para cobrar</h3><strong>$5.000</strong><label>Link de pago</label><p>https://mpago.la/tu-link</p><div className="payment-copy-button"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.004 5.996h-1.252V4.745a2.754 2.754 0 0 0-2.751-2.751H4.997a2.754 2.754 0 0 0-2.751 2.751v10.004A2.754 2.754 0 0 0 4.997 17.5h1.251v1.252a2.753 2.753 0 0 0 2.75 2.75h10.006a2.753 2.753 0 0 0 2.75-2.75V8.746a2.753 2.753 0 0 0-2.75-2.75ZM4.997 16a1.252 1.252 0 0 1-1.251-1.251V4.745c0-.69.561-1.251 1.251-1.251h10.004c.689 0 1.251.561 1.251 1.251v1.251H8.998a2.753 2.753 0 0 0-2.75 2.75V16H4.997Zm15.257 2.752c0 .689-.561 1.25-1.25 1.25H8.998a1.252 1.252 0 0 1-1.25-1.25V8.746c0-.689.561-1.25 1.25-1.25h10.006c.689 0 1.25.561 1.25 1.25v10.006Z" /></svg><span>Copiar link</span></div><small>El tutorial completo llega por email al iniciar tu plataforma.</small></div></section>
    <section className="testimonials"><span className="eyebrow">CLIENTES FELICES</span><h2>Negocios reales,<br />menos vueltas.</h2><div className="testimonial-grid"><figure><blockquote>“La aplicación anda genial. Mis clientes ya pueden elegir su horario sin escribirme a cada rato.”</blockquote><figcaption><strong>Brian</strong><span>BrianBarber</span></figcaption></figure><figure><blockquote>“Desde que la uso aumentaron mis clientes de masajes. Reservar se volvió mucho más fácil.”</blockquote><figcaption><strong>Antonella</strong><span>Masajista profesional</span></figcaption></figure></div></section>
    <section className="terms" id="terminos"><span className="eyebrow">CONDICIONES COMERCIALES</span><h2>Claro desde el inicio.</h2><p>El pago único de $40.000 incluye la configuración inicial y un año de garantía de la plataforma, sin abono mensual durante ese período. Las comisiones de Mercado Pago y servicios externos contratados por el negocio se cobran por separado. La personalización se realiza sobre la plantilla de Induliru y está sujeta a la información provista por cada profesional.</p><a className="text-link" href="mailto:hola@induliru.com?subject=Consulta%20sobre%20turnos%20Induliru">Consultar condiciones completas →</a></section>
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
  const [bookingNotice, setBookingNotice] = useState('');
  const [lookupDni, setLookupDni] = useState('');
  const [appointment, setAppointment] = useState();
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    setBusiness(undefined); setError(''); setBookingNotice(''); setForm({ name: '', dni: '', service: '', date: '', time: '' }); setSlots([]);
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
    event.preventDefault(); setError(''); setBookingNotice('');
    if (!(isPortuguese(business) ? /^\d{11}$/.test(form.dni) : /^\d{7,8}$/.test(form.dni))) return setError(isPortuguese(business) ? 'Informe um CPF válido com 11 dígitos.' : 'Ingresá un DNI válido de 7 u 8 dígitos.');
    setSaving(true);
    try {
      if (business.booking_without_payment === true) {
        const result = await createBooking({ ...form, service: form.service || 'consulta', business_slug: slug });
        setBookingNotice(isPortuguese(business)
          ? `Agendamento confirmado para ${new Date(`${result.booking.booking_date}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} às ${result.booking.booking_time.slice(0, 5)}.`
          : `Turno confirmado para ${new Date(`${result.booking.booking_date}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })} a las ${result.booking.booking_time.slice(0, 5)} hs.`);
        setSlots((current) => current.filter((slot) => slot !== form.time));
        setForm((current) => ({ ...current, name: '', dni: '', time: '' }));
        setSaving(false);
        return;
      }
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
    if (!appointment || !window.confirm(isPortuguese(business) ? 'Deseja cancelar este horário?' : '¿Querés cancelar este turno?')) return;
    try { await cancelAppointment(appointment.id, lookupDni, slug); setAppointment({ ...appointment, status: 'cancelled' }); }
    catch (err) { setLookupError(err.message); }
  }

  if (error && !business) return <Status title={slug === 'mirelle' ? 'Não encontramos esta página' : 'No encontramos esta página'} detail={error} portuguese={slug === 'mirelle'} />;
  if (!business) return <Status title={slug === 'mirelle' ? 'Carregando seu agendamento…' : 'Cargando tu turno…'} portuguese={slug === 'mirelle'} />;
  const portuguese = isPortuguese(business);
  const mirelle = slug === 'mirelle';
  const locale = portuguese ? 'pt-BR' : 'es-AR';
  const idLabel = portuguese ? 'CPF' : 'DNI';
  const bookingWithoutPayment = business.booking_without_payment === true;
  const bookingEnabled = business.services.length > 0 || bookingWithoutPayment;
  const displayedServices = business.services.length > 0 ? business.services : (bookingWithoutPayment ? [{ id: 'consulta', name: portuguese ? 'Consulta psicológica' : 'Consulta', description: portuguese ? 'Atendimento individual com escuta atenta.' : 'Atención individual.' }] : (Array.isArray(business.practice_areas) ? business.practice_areas : []));
  const consultationUrl = business.contact_whatsapp ? `https://wa.me/${String(business.contact_whatsapp).replace(/\D/g, '')}` : null;
  const paymentParams = new URLSearchParams(window.location.search);
  const paymentStatus = paymentParams.get('payment_status');
  const paymentDate = paymentParams.get('booking_date');
  const paymentTime = paymentParams.get('booking_time');
  const paymentId = paymentParams.get('payment_id') || paymentParams.get('collection_id');
  const paymentName = paymentParams.get('booking_name');
  const paymentService = paymentParams.get('booking_service');
  const paymentWhen = paymentDate ? `${new Date(`${paymentDate}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}${paymentTime ? portuguese ? ` às ${paymentTime}` : ` a las ${paymentTime} hs` : ''}` : portuguese ? 'a data selecionada' : 'la fecha seleccionada';
  const paymentWhatsappMessage = portuguese ? `Olá, sou ${paymentName || 'um cliente'} e acabei de pagar um agendamento para ${paymentWhen}.${paymentService ? ` ${paymentService}.` : ''}${paymentId ? ` Número do pagamento: ${paymentId}.` : ''}` : `Hola soy ${paymentName || 'un cliente'}, acabo de pagar una reserva para ${paymentWhen}.${paymentService ? ` ${paymentService}.` : ''}${paymentId ? ` Número de pago: ${paymentId}.` : ''}`;
  const paymentWhatsapp = `https://wa.me/5491154907428?text=${encodeURIComponent(paymentWhatsappMessage)}`;

  return <main className={`site${mirelle ? ' mirelle-site' : ''}`} style={{ '--accent': business.accent }}>
    <InduliruHeader locale={locale} />
    {paymentStatus === 'approved' && <section className="payment-result success" aria-label={portuguese ? 'Pagamento realizado' : 'Pago exitoso'}><div className="payment-result-icon" aria-hidden="true">✓</div><div className="payment-result-copy"><span className="eyebrow">{portuguese ? 'PAGAMENTO CONFIRMADO' : 'PAGO CONFIRMADO'}</span><h2>{portuguese ? 'Pagamento realizado!' : '¡Pago exitoso!'}</h2><p>{portuguese ? 'Seu agendamento foi registrado. Avise-nos pelo WhatsApp para confirmarmos seu horário.' : 'Tu reserva quedó registrada. Avisanos por WhatsApp para que podamos confirmarte el turno.'}</p><div className="payment-result-details"><span>{paymentWhen}</span>{paymentService && <span>{paymentService}</span>}{paymentId && <span>{portuguese ? 'Pagamento' : 'Pago'} #{paymentId}</span>}</div></div><a className="payment-whatsapp" href={paymentWhatsapp} target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />{portuguese ? 'Avisar pelo WhatsApp' : 'Avisar por WhatsApp'} <span>↗</span></a></section>}
    {paymentStatus && paymentStatus !== 'approved' && <div className="notice">{portuguese ? 'O pagamento está pendente. Você pode tentar novamente quando quiser.' : 'El pago quedó pendiente. Podés intentarlo nuevamente cuando quieras.'}</div>}
    {mirelle ? <>
      <section className="mirelle-hero"><div className="mirelle-hero-copy"><img src="/turnos/mirelle/mirelle-logo-transparent.png" alt="Mirelle Santiago · Psicóloga" /><span>PSICÓLOGA CLÍNICA · CRP 05/74679</span><h1>Um espaço para você se escutar com calma.</h1><p>Psicoterapia com acolhimento, ética e respeito ao seu tempo.</p><a className="mirelle-cta" href="#reserva">Agendar atendimento <span>→</span></a></div><div className="mirelle-hero-side"><p>Atendimento presencial e on-line</p><span>Rio de Janeiro · Brasil</span><div className="mirelle-hero-links"><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />WhatsApp <b>↗</b></a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="" />Instagram <b>↗</b></a><a href="mailto:mirellesantiago.psi@gmail.com"><img src="/turnos/GMAIL_LOGO.png" alt="" />E-mail <b>↗</b></a><a href="https://www.google.com/maps/search/?api=1&query=Rio+de+Janeiro,+Brasil" target="_blank" rel="noreferrer"><img src="/MAPS_LOGO.png" alt="" />Rio de Janeiro <b>↗</b></a></div></div></section>
      <section className="mirelle-story"><img src="/turnos/mirelle/mirelle-about.png" alt="Mirelle Santiago, psicóloga clínica" /><div><span className="eyebrow">SOBRE MIRELLE</span><h2>Escuta clínica para processos reais.</h2><p>Especialista em TCC pela PUCRS, Mirelle oferece um espaço de cuidado para quem busca compreender suas experiências e construir novos caminhos.</p><ul><li>Psicóloga clínica</li><li>Abordagem da Terapia Cognitivo-Comportamental</li><li>Interesse em Psicologia Jurídica e casos de família</li></ul><div className="mirelle-links"><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer">Falar no WhatsApp ↗</a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer">@mirellesantiago.psi ↗</a></div></div></section>
      <section className="mirelle-studio"><div><span className="eyebrow">O CONSULTÓRIO</span><h2>Um ambiente pensado para acolher.</h2><p>Atendimento presencial no Rio de Janeiro, em uma sala reservada, confortável e preparada para a sua escuta.</p></div><div className="mirelle-gallery"><img src="/turnos/mirelle/consultorio-1-enhanced.png" alt="Consultório de Mirelle Santiago" /><img src="/turnos/mirelle/consultorio-2.png" alt="Sala de atendimento de Mirelle Santiago" /></div></section>
      <section className="mirelle-contact"><span className="eyebrow">CONTATO</span><h2>Vamos conversar?</h2><p>Atendimento presencial e on-line em Rio de Janeiro, Brasil.</p><div><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />WhatsApp <span>↗</span></a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="" />Instagram <span>↗</span></a><a href="mailto:mirellesantiago.psi@gmail.com"><img src="/turnos/GMAIL_LOGO.png" alt="" />mirellesantiago.psi@gmail.com <span>↗</span></a></div></section>
    </> : <>
      <section className="hero-panel"><div><span className="eyebrow">{business.category}</span><h1>{business.name}</h1><p>{business.headline}</p><a className="hero-cta" href={bookingEnabled ? '#reserva' : (consultationUrl || '#reserva')} target={bookingEnabled || !consultationUrl ? undefined : '_blank'} rel={bookingEnabled || !consultationUrl ? undefined : 'noreferrer'}>{bookingEnabled ? (portuguese ? 'Quero agendar' : 'Quiero un turno') : (portuguese ? 'Falar pelo WhatsApp' : 'Consultar por WhatsApp')} <span>→</span></a><div className="hero-meta">{business.location} <span>·</span> {bookingEnabled ? (portuguese ? 'Agende online em poucos minutos' : 'Reservá online en minutos') : (portuguese ? 'Atendimento com agendamento prévio' : 'Atención con cita previa')}</div>{business.contact_email && <a className="hero-email" href={`mailto:${business.contact_email}`}>{business.contact_email}</a>}</div><div className="hero-orb" aria-hidden="true">✦</div></section>
      <section className="intro"><p>{business.description}</p><div className="trust"><span>{portuguese ? 'Atendimento personalizado' : 'Atención personalizada'}</span><span>{portuguese ? 'Pagamento seguro' : 'Pago seguro'}</span><span>{portuguese ? 'Confirmação online' : 'Confirmación online'}</span></div></section>
      <section className="services" aria-labelledby="services-title"><div className="section-heading"><span className="eyebrow">{bookingEnabled ? (portuguese ? 'SERVIÇOS' : 'SERVICIOS') : (portuguese ? 'ÁREAS DE ATUAÇÃO' : 'ÁREAS DE PRÁCTICA')}</span><h2>{bookingEnabled ? (portuguese ? 'Escolha seu próximo atendimento.' : 'Elegí tu próximo look.') : (portuguese ? 'Como posso ajudar?' : 'Asesoramiento para cada situación.')}</h2></div><div className="service-grid">{displayedServices.map((service) => <article className="service-card" key={service.id}><h3>{service.name}</h3><p>{service.description}</p>{bookingEnabled ? <>{Number.isFinite(Number(service.price)) && <strong>{formatPrice(service.price, locale)}</strong>}<button onClick={() => { setForm((current) => ({ ...current, service: service.id })); document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' }); }}>{portuguese ? 'Escolher serviço' : 'Elegir servicio'} <span>→</span></button></> : consultationUrl && <a className="service-contact" href={consultationUrl} target="_blank" rel="noreferrer">{portuguese ? 'Consultar pelo WhatsApp' : 'Consultar por WhatsApp'} <span>→</span></a>}</article>)}</div>{displayedServices.length === 0 && <p className="muted">{portuguese ? 'Os serviços estarão disponíveis em breve.' : 'Los servicios estarán disponibles próximamente.'}</p>}</section>
    </>}
    <section className="booking-section" id="reserva">
      <div className="section-heading"><span className="eyebrow">{portuguese ? 'AGENDE SEU HORÁRIO' : 'RESERVÁ TU TURNO'}</span><h2>{portuguese ? 'Peça um horário.' : 'Pedí un turno.'}</h2></div>
      {!bookingEnabled ? <div className="booking-card"><p className="muted">{portuguese ? 'Os agendamentos online serão habilitados em breve. Entre em contato para combinar uma consulta.' : 'Los turnos online se habilitarán próximamente. Contactanos para coordinar una consulta.'}</p>{consultationUrl && <a className="button submit" href={consultationUrl} target="_blank" rel="noreferrer">{portuguese ? 'Consultar pelo WhatsApp' : 'Consultar por WhatsApp'}</a>}</div> : <form className="booking-card" onSubmit={submit}>
        <label>{portuguese ? 'Nome e sobrenome' : 'Nombre y apellido'}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={portuguese ? 'Ex.: Maria Fernandes' : 'Ej. María Fernández'} /></label>
        <label>{idLabel}<input required inputMode="numeric" maxLength={portuguese ? '11' : '8'} value={form.dni} onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })} placeholder={portuguese ? 'Somente números' : 'Sin puntos'} /></label>
        {!(bookingWithoutPayment && business.services.length === 0) && <label>{portuguese ? 'Serviço' : 'Servicio'}<select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}><option value="">{portuguese ? 'Escolha um serviço' : 'Elegí un servicio'}</option>{business.services.map((item) => <option value={item.id} key={item.id}>{item.name}{Number.isFinite(Number(item.price)) ? ` — ${formatPrice(item.price, locale)}` : ''}</option>)}</select></label>}
        <fieldset><legend>{portuguese ? 'Data' : 'Fecha'}</legend><InlineCalendar month={calendarMonth} availableDates={availableDates} selectedDate={form.date} onSelect={selectDate} onMonthChange={setCalendarMonth} loading={loadingDates} locale={locale} /></fieldset>
        <fieldset><legend>{portuguese ? 'Horário' : 'Horario'}</legend>{!form.date && <p className="muted">{portuguese ? 'Escolha uma data disponível no calendário.' : 'Elegí una fecha disponible en el calendario.'}</p>}{loadingSlots && <p className="muted">{portuguese ? 'Buscando horários…' : 'Buscando horarios…'}</p>}{form.date && !loadingSlots && slots.length === 0 && <p className="muted">{portuguese ? 'Não há horários disponíveis para este dia.' : 'No hay horarios disponibles para ese día.'}</p>}<div className="slots">{slots.map((slot) => <button type="button" className={form.time === slot ? 'selected' : ''} key={slot} onClick={() => setForm({ ...form, time: slot })}>{slot}</button>)}</div></fieldset>
        {bookingNotice && <p className="booking-confirmation" role="status">✓ {bookingNotice}</p>}{error && <p className="form-error" role="alert">{error}</p>}
        <button className="button submit" disabled={saving || !form.time}>{saving ? (bookingWithoutPayment ? (portuguese ? 'Confirmando agendamento…' : 'Confirmando turno…') : (portuguese ? 'Redirecionando para o pagamento…' : 'Redirigiendo al pago…')) : (bookingWithoutPayment ? (portuguese ? 'Confirmar agendamento' : 'Confirmar turno') : (portuguese ? 'Continuar para o pagamento' : 'Continuar al pago'))}</button>
        {bookingWithoutPayment ? <p className="payment-copy">{portuguese ? 'Agendamento sem pagamento online.' : 'Reserva sin pago online.'}</p> : <p className="payment-copy"><img src="/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" />{portuguese ? 'Pagamento seguro processado pelo Mercado Pago.' : 'Pago seguro procesado por Mercado Pago.'}</p>}
      </form>}
    </section>
    <section className="lookup"><div><span className="eyebrow">{portuguese ? 'JÁ TEM UM HORÁRIO?' : '¿YA TENÉS TURNO?'}</span><h2>{portuguese ? 'Consulte ou cancele.' : 'Consultalo o cancelalo.'}</h2></div><form onSubmit={searchAppointment}><label>{idLabel}<input inputMode="numeric" maxLength={portuguese ? '11' : '8'} value={lookupDni} onChange={(e) => setLookupDni(e.target.value.replace(/\D/g, ''))} placeholder={portuguese ? 'Informe seu CPF' : 'Ingresá tu DNI'} required /></label><button className="button outline">{portuguese ? 'Ver meu horário' : 'Ver mi turno'}</button></form>{lookupError && <p className="form-error">{lookupError}</p>}{appointment === null && <p className="muted">{portuguese ? 'Não encontramos um agendamento ativo com este CPF.' : 'No encontramos un turno activo con ese DNI.'}</p>}{appointment && <div className="appointment"><strong>{appointment.name}</strong><span>{business.services.find((item) => item.id === appointment.service)?.name || appointment.service}</span><span>{new Date(`${appointment.booking_date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.booking_time.slice(0, 5)} hs</span>{appointment.status === 'cancelled' ? <em>{portuguese ? 'Agendamento cancelado' : 'Turno cancelado'}</em> : <button onClick={cancel}>{portuguese ? 'Cancelar horário' : 'Cancelar turno'}</button>}</div>}</section>
    <SiteFooter />
  </main>;
}

function SiteFooter() { return <footer className="site-footer"><p className="footer-copy">© 2026 <b>Induliru</b>. Innovación | Calidad | Desarrollo. Todos los derechos reservados.</p><div className="footer-links"><a href="https://wa.me/5491172657749" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="WhatsApp" />+54 9 11 7265-7749</a><a href="https://www.instagram.com/induliru.tech/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="Instagram" />@induliru.tech</a><a href="mailto:hola@induliru.com"><img src="/turnos/GMAIL_LOGO.png" alt="Email" />hola@induliru.com</a></div></footer>; }

function Status({ title, detail, portuguese = false }) { return <main className="directory"><span className="eyebrow">INDULIRU · TURNOS</span><h1>{title}</h1>{detail && <p>{detail}</p>}<Link className="button" to="/">{portuguese ? 'Voltar ao início' : 'Ir al inicio'}</Link></main>; }
function PanelRedirect({ to }) { useEffect(() => { window.location.replace(`${to}${window.location.search}`); }, [to]); return <Status title="Abriendo el panel…" />; }

export default function App() { return <Routes><Route path="/" element={<Home />} /><Route path="/admin" element={<PanelRedirect to="https://induliru.com/turnos/admin/" />} /><Route path="/adminadmin" element={<PanelRedirect to="https://gadielma.github.io/turnos/adminadmin/" />} /><Route path="/:slug" element={<BookingPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }
