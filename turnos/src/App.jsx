import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { cancelAppointment, createBooking, createPreference, findAppointment, getAvailability, getAvailabilityMonth, getBusiness } from './api';

const argentinaDateParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit',
}).formatToParts(new Date());
const argentinaDatePart = (type) => argentinaDateParts.find((part) => part.type === type)?.value;
const today = `${argentinaDatePart('year')}-${argentinaDatePart('month')}-${argentinaDatePart('day')}`;
const formatPrice = (price, locale = 'es-AR') => new Intl.NumberFormat(locale, { style: 'currency', currency: locale === 'pt-BR' ? 'BRL' : 'ARS', maximumFractionDigits: 0 }).format(Number(price));
const gmailCompose = (email) => `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
const isPortuguese = (business) => business?.locale === 'pt-BR';
function InduliruHeader({ locale, onToggleLanguage }) { const portuguese = locale === 'pt-BR'; return <header className="global-header"><div className="global-header-inner"><a href="/" className="global-brand"><img src="/LOGO.png" alt="Logo Induliru" />INDULIRU</a><nav className="global-menu"><a href="/#nosotros">{portuguese ? 'Sobre nós' : 'Nosotros'}</a><a href="/#productos">{portuguese ? 'Produtos' : 'Productos'}</a><Link to="/">{portuguese ? 'Agendamentos' : 'Turnos'}</Link><a href="/#contacto">{portuguese ? 'Contato' : 'Contacto'}</a></nav>{onToggleLanguage && <button className="language-toggle" type="button" onClick={onToggleLanguage} aria-label={portuguese ? 'Cambiar a español' : 'Mudar para português'}>{portuguese ? '🇦🇷 ES' : '🇧🇷 PT'}</button>}</div></header>; }
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
  const [portuguese, setPortuguese] = useState(false);
  return <main className="platform">
    <InduliruHeader locale={portuguese ? 'pt-BR' : 'es-AR'} onToggleLanguage={() => setPortuguese((current) => !current)} />
    <section className="platform-hero">
      <div><span className="eyebrow">INDULIRU · TURNOS</span><h1>{portuguese ? <>Sua agenda online.<br /><em>Pronta para vender.</em></> : <>Tu agenda online.<br /><em>Lista para vender.</em></>}</h1><p>{portuguese ? 'Uma página profissional para seus clientes escolherem serviço, horário e pagarem a reserva pelo celular.' : 'Una página profesional para que tus clientes elijan servicio, horario y paguen su reserva desde el celular.'}</p><div className="platform-actions"><a className="button" href={`https://wa.me/5491172657749?text=${encodeURIComponent(portuguese ? 'Olá, quero minha plataforma de agendamentos Induliru.' : 'Hola, quiero mi plataforma de turnos Induliru.')}`} target="_blank" rel="noreferrer">{portuguese ? 'Quero minha plataforma' : 'Quiero mi plataforma'}</a></div></div>
      <aside className="offer-card"><span>{portuguese ? 'LANÇAMENTO' : 'LANZAMIENTO'}</span><strong>$40.000</strong><p>{portuguese ? 'Pagamento único' : 'Pago único'}</p><hr /><b>{portuguese ? '1 ano de garantia' : '1 año de garantía'}</b><small>{portuguese ? 'Sem mensalidade. O Mercado Pago cobra suas comissões habituais.' : 'Sin cuotas mensuales. Mercado Pago cobra sus comisiones habituales.'}</small></aside>
    </section>
    <section className="client-showcase">
      <div className="section-heading"><span className="eyebrow">{portuguese ? 'PÁGINAS EM VIVO' : 'PÁGINAS EN VIVO'}</span><h2>{portuguese ? 'Cada negócio, uma identidade própria.' : 'Cada negocio, una identidad propia.'}</h2><p>{portuguese ? 'Conheça páginas reais criadas para cada profissional.' : 'Conocé páginas reales creadas para cada profesional.'}</p></div>
      <div className="client-preview-grid">
        <Link className="client-preview-card" to="/brian"><img src="/turnos/clients/brian-preview.png" alt="Vista previa de BrianBarber" /><div><span>BARBERÍA</span><strong>BrianBarber</strong><b>{portuguese ? 'Ver página' : 'Ver sitio'} <i>→</i></b></div></Link>
        <Link className="client-preview-card" to="/mirelle"><img src="/turnos/clients/mirelle-preview.png" alt="Vista previa de Mirelle Santiago" /><div><span>{portuguese ? 'PSICOLOGIA' : 'PSICOLOGÍA'}</span><strong>Mirelle Santiago</strong><b>{portuguese ? 'Ver página' : 'Ver sitio'} <i>→</i></b></div></Link>
        <Link className="client-preview-card" to="/sardi"><img src="/turnos/clients/sardi-preview.png" alt="Vista previa de Sardi Estudio Jurídico" /><div><span>{portuguese ? 'ESCRITÓRIO JURÍDICO' : 'ESTUDIO JURÍDICO'}</span><strong>Sardi Estudio</strong><b>{portuguese ? 'Ver página' : 'Ver sitio'} <i>→</i></b></div></Link>
      </div>
    </section>
    <section className="platform-proof"><p>{portuguese ? 'Tudo o que você precisa para organizar seus horários e transmitir uma imagem profissional desde o primeiro dia.' : 'Todo lo que necesitás para ordenar tus turnos y dar una imagen profesional desde el primer día.'}</p><div><span>Reservas 24/7</span><span>{portuguese ? 'Pagamento online' : 'Pago online'}</span><span>{portuguese ? 'Agenda editável' : 'Agenda editable'}</span></div></section>
    <section className="how-it-works"><div className="section-heading"><span className="eyebrow">{portuguese ? 'É SIMPLES ASSIM' : 'ASÍ DE SIMPLE'}</span><h2>{portuguese ? <>Você atende.<br />A plataforma organiza.</> : <>Vos atendés.<br />La plataforma ordena.</>}</h2></div><ol><li><span>01</span><div><h3>{portuguese ? 'Você nos passa suas informações' : 'Nos pasás tu información'}</h3><p>{portuguese ? 'Serviços, preços, horários, fotos e dados de contato.' : 'Servicios, precios, horarios, fotos y datos de contacto.'}</p></div></li><li><span>02</span><div><h3>{portuguese ? 'Você gera seu link do Mercado Pago' : 'Generás tu link de Mercado Pago'}</h3><p>{portuguese ? 'Com um link de pagamento, você já pode receber reservas pagas.' : 'Con un link de cobro de Mercado Pago ya podés recibir reservas pagas.'}</p></div></li><li><span>03</span><div><h3>{portuguese ? 'Publicamos sua página' : 'Publicamos tu página'}</h3><p>{portuguese ? 'Você recebe uma página com agenda online para compartilhar no WhatsApp, Instagram ou Google.' : 'Recibís una web con agenda online para compartir por WhatsApp, Instagram o Google.'}</p></div></li></ol></section>
    <section className="tutorial"><div className="section-heading"><span className="eyebrow">{portuguese ? 'CONFIGURAÇÃO SIMPLES' : 'CONFIGURACIÓN SIMPLE'}</span><h2>{portuguese ? 'Assim começa a funcionar.' : 'Así se pone en marcha.'}</h2><p>{portuguese ? 'O único passo técnico é criar seu link do Mercado Pago. Nós cuidamos do restante.' : 'El único paso técnico que necesitás hacer es crear tu link de Mercado Pago. Del resto nos ocupamos nosotros.'}</p></div><div className="payment-preview" aria-label="Ejemplo de un link de pago de Mercado Pago"><img className="payment-logo" src="/turnos/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" /><span>{portuguese ? 'EXEMPLO DE LINK DE PAGAMENTO' : 'EJEMPLO DE LINK DE PAGO'}</span><h3>{portuguese ? <>Compartilhe seu link<br />para cobrar</> : <>Compartí tu link<br />para cobrar</>}</h3><strong>$5.000</strong><label>{portuguese ? 'Link de pagamento' : 'Link de pago'}</label><p>https://mpago.la/tu-link</p><div className="payment-copy-button"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19.004 5.996h-1.252V4.745a2.754 2.754 0 0 0-2.751-2.751H4.997a2.754 2.754 0 0 0-2.751 2.751v10.004A2.754 2.754 0 0 0 4.997 17.5h1.251v1.252a2.753 2.753 0 0 0 2.75 2.75h10.006a2.753 2.753 0 0 0 2.75-2.75V8.746a2.753 2.753 0 0 0-2.75-2.75ZM4.997 16a1.252 1.252 0 0 1-1.251-1.251V4.745c0-.69.561-1.251 1.251-1.251h10.004c.689 0 1.251.561 1.251 1.251v1.251H8.998a2.753 2.753 0 0 0-2.75 2.75V16H4.997Zm15.257 2.752c0 .689-.561 1.25-1.25 1.25H8.998a1.252 1.252 0 0 1-1.25-1.25V8.746c0-.689.561-1.25 1.25-1.25h10.006c.689 0 1.25.561 1.25 1.25v10.006Z" /></svg><span>Copiar link</span></div><small>{portuguese ? 'O tutorial completo chega por e-mail ao iniciar sua plataforma.' : 'El tutorial completo llega por email al iniciar tu plataforma.'}</small></div></section>
    <section className="testimonials"><span className="eyebrow">{portuguese ? 'CLIENTES FELIZES' : 'CLIENTES FELICES'}</span><h2>{portuguese ? <>Negócios reais,<br />menos complicação.</> : <>Negocios reales,<br />menos vueltas.</>}</h2><div className="testimonial-grid"><figure><blockquote>{portuguese ? '“O aplicativo funciona muito bem. Meus clientes já podem escolher o horário sem precisar me escrever o tempo todo.”' : '“La aplicación anda genial. Mis clientes ya pueden elegir su horario sin escribirme a cada rato.”'}</blockquote><figcaption><strong>Brian</strong><span>BrianBarber</span></figcaption></figure></div></section>
    <section className="terms" id="terminos"><span className="eyebrow">{portuguese ? 'CONDIÇÕES COMERCIAIS' : 'CONDICIONES COMERCIALES'}</span><h2>{portuguese ? 'Claro desde o começo.' : 'Claro desde el inicio.'}</h2><p>{portuguese ? 'O pagamento único de $40.000 inclui a configuração inicial e um ano de garantia da plataforma, sem mensalidade nesse período. As comissões do Mercado Pago e serviços externos do negócio são cobradas separadamente. A personalização é feita sobre o modelo Induliru e depende das informações fornecidas por cada profissional.' : 'El pago único de $40.000 incluye la configuración inicial y un año de garantía de la plataforma, sin abono mensual durante ese período. Las comisiones de Mercado Pago y servicios externos contratados por el negocio se cobran por separado. La personalización se realiza sobre la plantilla de Induliru y está sujeta a la información provista por cada profesional.'}</p><a className="text-link" href={`mailto:hola@induliru.com?subject=${encodeURIComponent(portuguese ? 'Consulta sobre agendamentos Induliru' : 'Consulta sobre turnos Induliru')}`}>{portuguese ? 'Consultar condições completas' : 'Consultar condiciones completas'} →</a></section>
    <SiteFooter locale={portuguese ? 'pt-BR' : 'es-AR'} />
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
    const openGmail = (event) => {
      const link = event.target.closest('a[href^="mailto:"]');
      if (!link) return;
      event.preventDefault();
      const email = link.getAttribute('href').slice('mailto:'.length).split('?')[0];
      window.open(gmailCompose(email), '_blank', 'noopener,noreferrer');
    };
    document.addEventListener('click', openGmail);
    return () => document.removeEventListener('click', openGmail);
  }, []);

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
        setSlots((current) => current.filter((slot) => (typeof slot === 'string' ? slot : slot.time) !== form.time));
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

  if (error && !business) return <Status title={slug === 'mirelle' ? 'Não encontramos esta página' : 'No encontramos esta página'} detail={error} portuguese={slug === 'mirelle'} variant={slug} />;
  if (!business) return <Status title={slug === 'mirelle' ? 'Carregando seu agendamento…' : 'Cargando tu turno…'} portuguese={slug === 'mirelle'} variant={slug} />;
  const portuguese = isPortuguese(business);
  const mirelle = slug === 'mirelle';
  const sardi = slug === 'sardi';
  const brian = slug === 'brian';
  const locale = portuguese ? 'pt-BR' : 'es-AR';
  const idLabel = portuguese ? 'CPF' : 'DNI';
  const bookingWithoutPayment = business.booking_without_payment === true;
  const selectedSlot = slots.find((slot) => (typeof slot === 'string' ? slot : slot.time) === form.time);
  const selectedWorkplace = selectedSlot && typeof selectedSlot !== 'string' ? (business.workplaces || []).find((place) => place.id === selectedSlot.workplace_id) : null;
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

  return <main className={`site${mirelle ? ' mirelle-site' : ''}${sardi ? ' sardi-site' : ''}${brian ? ' brian-site' : ''}`} style={{ '--accent': business.accent }}>
    <InduliruHeader locale={locale} />
    {paymentStatus === 'approved' && <section className="payment-result success" aria-label={portuguese ? 'Pagamento realizado' : 'Pago exitoso'}><div className="payment-result-icon" aria-hidden="true">✓</div><div className="payment-result-copy"><span className="eyebrow">{portuguese ? 'PAGAMENTO CONFIRMADO' : 'PAGO CONFIRMADO'}</span><h2>{portuguese ? 'Pagamento realizado!' : '¡Pago exitoso!'}</h2><p>{portuguese ? 'Seu agendamento foi registrado. Avise-nos pelo WhatsApp para confirmarmos seu horário.' : 'Tu reserva quedó registrada. Avisanos por WhatsApp para que podamos confirmarte el turno.'}</p><div className="payment-result-details"><span>{paymentWhen}</span>{paymentService && <span>{paymentService}</span>}{paymentId && <span>{portuguese ? 'Pagamento' : 'Pago'} #{paymentId}</span>}</div></div><a className="payment-whatsapp" href={paymentWhatsapp} target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />{portuguese ? 'Avisar pelo WhatsApp' : 'Avisar por WhatsApp'} <span>↗</span></a></section>}
    {paymentStatus && paymentStatus !== 'approved' && <div className="notice">{portuguese ? 'O pagamento está pendente. Você pode tentar novamente quando quiser.' : 'El pago quedó pendiente. Podés intentarlo nuevamente cuando quieras.'}</div>}
    {mirelle ? <>
      <section className="mirelle-hero"><div className="mirelle-hero-copy"><img src="/turnos/mirelle/mirelle-logo-transparent.png" alt="Mirelle Santiago · Psicóloga" /><span>PSICÓLOGA CLÍNICA · CRP 05/74679</span><h1>Um espaço para você se escutar com calma.</h1><p>Psicoterapia com acolhimento, ética e respeito ao seu tempo.</p><a className="mirelle-cta" href="#reserva">Agendar atendimento <span>→</span></a></div><div className="mirelle-hero-side"><p>Atendimento presencial e on-line</p><span>Rio de Janeiro · Brasil</span><div className="mirelle-hero-links"><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />WhatsApp <b>↗</b></a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="" />Instagram <b>↗</b></a><a href="mailto:mirellesantiago.psi@gmail.com"><img src="/turnos/GMAIL_LOGO.png" alt="" />E-mail <b>↗</b></a><a href="https://www.google.com/maps/search/?api=1&query=Rio+de+Janeiro,+Brasil" target="_blank" rel="noreferrer"><img src="/MAPS_LOGO.png" alt="" />Rio de Janeiro <b>↗</b></a></div></div></section>
      <section className="mirelle-story"><img src="/turnos/mirelle/mirelle-about.png" alt="Mirelle Santiago, psicóloga clínica" /><div><span className="eyebrow">SOBRE MIRELLE</span><h2>Escuta clínica para processos reais.</h2><p>Especialista em TCC pela PUCRS, Mirelle oferece um espaço de cuidado para quem busca compreender suas experiências e construir novos caminhos.</p><ul><li>Psicóloga clínica</li><li>Abordagem da Terapia Cognitivo-Comportamental</li><li>Interesse em Psicologia Jurídica e casos de família</li></ul><div className="mirelle-links"><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer">Falar no WhatsApp ↗</a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer">@mirellesantiago.psi ↗</a></div></div></section>
      <section className="mirelle-studio"><div><span className="eyebrow">O CONSULTÓRIO</span><h2>Um ambiente pensado para acolher.</h2><p>Atendimento presencial no Rio de Janeiro, em uma sala reservada, confortável e preparada para a sua escuta.</p></div><div className="mirelle-gallery"><img src="/turnos/mirelle/consultorio-1-enhanced.png" alt="Consultório de Mirelle Santiago" /><img src="/turnos/mirelle/consultorio-2.png" alt="Sala de atendimento de Mirelle Santiago" /></div></section>
      <section className="mirelle-contact"><span className="eyebrow">CONTATO</span><h2>Vamos conversar?</h2><p>Atendimento presencial e on-line em Rio de Janeiro, Brasil.</p><div><a href="https://api.whatsapp.com/message/L3VCCOPOI7BLF1?autoload=1&app_absent=0&utm_source=ig" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />WhatsApp <span>↗</span></a><a href="https://www.instagram.com/mirellesantiago.psi/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="" />Instagram <span>↗</span></a><a href="mailto:mirellesantiago.psi@gmail.com"><img src="/turnos/GMAIL_LOGO.png" alt="" />mirellesantiago.psi@gmail.com <span>↗</span></a></div></section>
    </> : sardi ? <>
      <section className="sardi-hero">
        <div className="sardi-hero-copy"><img src="/turnos/sardi/sardi-logo-transparent.png" alt="Sardi Estudio Jurídico" /><span className="eyebrow">ENRIQUE SARDI · ABOGADO</span><h1>Respaldo legal para decisiones importantes.</h1><p>Asesoramiento jurídico, inmobiliario y notarial, con una mirada estratégica y atención personalizada.</p><a className="sardi-cta" href="#reserva">Reservar una consulta <span>→</span></a></div>
        <aside className="sardi-contact-card"><span>ESTUDIO SARDI</span><p>Atención presencial y remota.</p><a href="https://wa.me/5491156166994" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="" />11 5616-6994 <b>↗</b></a><a href={gmailCompose('sea.abogado@gmail.com')} target="_blank" rel="noreferrer"><img src="/turnos/GMAIL_LOGO.png" alt="" />sea.abogado@gmail.com <b>↗</b></a><a href="https://www.google.com/maps/search/?api=1&query=Chivilcoy+1441,+CABA" target="_blank" rel="noreferrer"><img src="/MAPS_LOGO.png" alt="" />Chivilcoy 1441, CABA <b>↗</b></a></aside>
      </section>
      <section className="sardi-profile"><img src="/turnos/sardi/enrique-sardi.png" alt="Enrique Sardi" /><div><span className="eyebrow">SARDI ESTUDIO JURÍDICO</span><h2>Claridad y compromiso en cada paso.</h2><p>Enrique Sardi brinda asesoramiento legal para personas, familias y empresas. Un acompañamiento serio y cercano para prevenir conflictos y resolverlos con fundamentos.</p><div className="sardi-profile-notes"><span>Gestiones judiciales en Buenos Aires y Mendoza</span><span>Asesoramiento presencial y online</span></div></div></section>
      <section className="sardi-areas"><div className="section-heading"><span className="eyebrow">ÁREAS DE PRÁCTICA</span><h2>Soluciones legales para lo que necesitás resolver.</h2></div><div className="sardi-area-grid"><article><b>01</b><h3>Sucesiones</h3><p>Planificación y tramitación sucesoria con acompañamiento en cada etapa.</p></article><article><b>02</b><h3>Derechos reales</h3><p>Asesoramiento inmobiliario y notarial para decisiones patrimoniales seguras.</p></article><article><b>03</b><h3>Registro de marcas</h3><p>Protegé tu identidad comercial y consolidá el valor de tu marca.</p></article><article><b>04</b><h3>Sociedades comerciales</h3><p>Constitución, organización y asesoramiento para tu actividad empresarial.</p></article><article><b>05</b><h3>Contratos</h3><p>Documentos claros que resguardan tus acuerdos y tus intereses.</p></article></div></section>
      <section className="sardi-marks"><img src="/turnos/sardi/registro-marcas-limpio.png" alt="Registro de marcas" /><div><span className="eyebrow">REGISTRO DE MARCAS</span><h2>¿Tu marca está protegida?</h2><p>Registrar a tiempo evita conflictos después. Consultá por el análisis y la gestión del registro de tu marca.</p><a href="https://wa.me/5491156166994" target="_blank" rel="noreferrer">Consultar por WhatsApp <span>→</span></a></div></section>
    </> : brian ? <>
      <section className="brian-hero"><div className="brian-hero-shade" /><div className="brian-hero-copy"><img className="brian-hero-logo" src="/turnos/brian/brianbarber-logo.png" alt="Logo BrianBarber" /><span>BARBERÍA · VILLA DEL PARQUE</span><h1>Tu estilo,<br /><em>bien cuidado.</em></h1><p>Cortes y barba con atención personalizada. Reservá tu turno online en minutos.</p><a className="brian-cta" href="#reserva">Quiero un turno <b>→</b></a></div><div className="brian-hero-note"><b>BrianBarber</b><span>Cuenca 2838 · CABA</span><span>Lunes a viernes · 14 a 19 hs</span></div></section>
      <section className="brian-story"><div className="brian-collage"><img src="/turnos/brian/barberia-1.jpeg" alt="Espacio de BrianBarber" /><img src="/turnos/brian/barberia-2.jpeg" alt="Brian preparando la barbería" /><span>BB</span></div><div><span className="eyebrow">UN ESPACIO PARA VOS</span><h2>El ritual de verte bien.</h2><p>Un sillón, una charla y el detalle justo. En BrianBarber cada turno se trabaja con tiempo, precisión y buena energía.</p><div className="brian-list"><span>✦ Cortes personalizados</span><span>✦ Barba y perfilado</span><span>✦ Reserva simple desde el celular</span></div><a href="#reserva">Reservar ahora <b>→</b></a></div></section>
      <section className="brian-services"><div className="section-heading"><span className="eyebrow">SERVICIOS</span><h2>Elegí cómo querés salir.</h2></div><div className="brian-service-grid">{displayedServices.map((service, index) => <article key={service.id}><span>0{index + 1}</span><h3>{service.name}</h3><p>{service.description}</p>{Number.isFinite(Number(service.price)) && <strong>{formatPrice(service.price, locale)}</strong>}<button onClick={() => { setForm((current) => ({ ...current, service: service.id })); document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' }); }}>Reservar <b>→</b></button></article>)}</div></section>
      <section className="brian-callout"><div><span>BRIANBARBER</span><h2>Tu próximo turno empieza acá.</h2><p>Elegí servicio, fecha y horario. El resto lo hacemos fácil.</p></div><a href="#reserva">Reservar turno <b>→</b></a></section>
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
        <fieldset><legend>{portuguese ? 'Horário' : 'Horario'}</legend>{!form.date && <p className="muted">{portuguese ? 'Escolha uma data disponível no calendário.' : 'Elegí una fecha disponible en el calendario.'}</p>}{loadingSlots && <p className="muted">{portuguese ? 'Buscando horários…' : 'Buscando horarios…'}</p>}{form.date && !loadingSlots && slots.length === 0 && <p className="muted">{portuguese ? 'Não há horários disponíveis para este dia.' : 'No hay horarios disponibles para ese día.'}</p>}<div className="slots">{slots.map((slot) => { const time = typeof slot === 'string' ? slot : slot.time; return <button type="button" className={form.time === time ? 'selected' : ''} key={time} onClick={() => setForm({ ...form, time })}>{time}</button>; })}</div>{selectedWorkplace && <p className="slot-workplace"><i style={{ backgroundColor: selectedWorkplace.color }} />{portuguese ? `Este atendimento será ${selectedWorkplace.name.toLowerCase() === 'virtual' ? 'virtual' : `em ${selectedWorkplace.name}`}.` : `Este turno será ${selectedWorkplace.name.toLowerCase() === 'virtual' ? 'virtual' : `en ${selectedWorkplace.name}`}.`}</p>}</fieldset>
        {bookingNotice && <p className="booking-confirmation" role="status">✓ {bookingNotice}</p>}{error && <p className="form-error" role="alert">{error}</p>}
        <button className="button submit" disabled={saving || !form.time}>{saving ? (bookingWithoutPayment ? (portuguese ? 'Confirmando agendamento…' : 'Confirmando turno…') : (portuguese ? 'Redirecionando para o pagamento…' : 'Redirigiendo al pago…')) : (bookingWithoutPayment ? (portuguese ? 'Confirmar agendamento' : 'Confirmar turno') : (portuguese ? 'Continuar para o pagamento' : 'Continuar al pago'))}</button>
        {bookingWithoutPayment ? <p className="payment-copy">{portuguese ? 'Agendamento sem pagamento online.' : 'Reserva sin pago online.'}</p> : <p className="payment-copy"><img src="/MERCADO_PAGO_LOGO.png" alt="Mercado Pago" />{portuguese ? 'Pagamento seguro processado pelo Mercado Pago.' : 'Pago seguro procesado por Mercado Pago.'}</p>}
      </form>}
    </section>
    <section className="lookup"><div><span className="eyebrow">{portuguese ? 'JÁ TEM UM HORÁRIO?' : '¿YA TENÉS TURNO?'}</span><h2>{portuguese ? 'Consulte ou cancele.' : 'Consultalo o cancelalo.'}</h2></div><form onSubmit={searchAppointment}><label>{idLabel}<input inputMode="numeric" maxLength={portuguese ? '11' : '8'} value={lookupDni} onChange={(e) => setLookupDni(e.target.value.replace(/\D/g, ''))} placeholder={portuguese ? 'Informe seu CPF' : 'Ingresá tu DNI'} required /></label><button className="button outline">{portuguese ? 'Ver meu horário' : 'Ver mi turno'}</button></form>{lookupError && <p className="form-error">{lookupError}</p>}{appointment === null && <p className="muted">{portuguese ? 'Não encontramos um agendamento ativo com este CPF.' : 'No encontramos un turno activo con ese DNI.'}</p>}{appointment && <div className="appointment"><strong>{appointment.name}</strong><span>{business.services.find((item) => item.id === appointment.service)?.name || appointment.service}</span><span>{new Date(`${appointment.booking_date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })} · {appointment.booking_time.slice(0, 5)} hs</span>{appointment.status === 'cancelled' ? <em>{portuguese ? 'Agendamento cancelado' : 'Turno cancelado'}</em> : <button onClick={cancel}>{portuguese ? 'Cancelar horário' : 'Cancelar turno'}</button>}</div>}</section>
    <SiteFooter />
  </main>;
}

function SiteFooter({ locale = 'es-AR' }) { const portuguese = locale === 'pt-BR'; return <footer className="site-footer"><p className="footer-copy">© 2026 <b>Induliru</b>. {portuguese ? 'Inovação | Qualidade | Desenvolvimento. Todos os direitos reservados.' : 'Innovación | Calidad | Desarrollo. Todos los derechos reservados.'}</p><div className="footer-links"><a href="https://wa.me/5491172657749" target="_blank" rel="noreferrer"><img src="/turnos/WSP_LOGO.png" alt="WhatsApp" />+54 9 11 7265-7749</a><a href="https://www.instagram.com/induliru.tech/" target="_blank" rel="noreferrer"><img src="/turnos/INSTA_LOGO.png" alt="Instagram" />@induliru.tech</a><a href="mailto:hola@induliru.com"><img src="/turnos/GMAIL_LOGO.png" alt="Email" />hola@induliru.com</a></div></footer>; }

function Status({ title, detail, portuguese = false, variant = '' }) {
  if (variant === 'sardi') return <main className="sardi-status"><div className="sardi-status-card"><img src="/turnos/sardi/sardi-logo-transparent.png" alt="Sardi Estudio Jurídico" /><span>ENRIQUE SARDI · ABOGADO</span><div className="sardi-status-loader" aria-hidden="true"><i /><i /><i /></div><h1>{title}</h1>{detail && <p>{detail}</p>}{detail ? <Link className="sardi-status-back" to="/turnos/sardi">Reintentar</Link> : <small>Estamos preparando tu espacio de consulta.</small>}</div></main>;
  if (variant === 'brian') return <main className="brian-status"><div className="brian-status-shade" /><div className="brian-status-card"><span>BRIANBARBER · VILLA DEL PARQUE</span><div className="brian-status-loader" aria-hidden="true"><i /><i /><i /></div><h1>{title}</h1>{detail && <p>{detail}</p>}{detail ? <Link className="brian-status-back" to="/turnos/brian">Reintentar</Link> : <small>Preparando una experiencia bien cuidada.</small>}</div></main>;
  if (variant === 'mirelle') return <main className="mirelle-status"><div className="mirelle-status-card"><img src="/turnos/mirelle/mirelle-logo-transparent.png" alt="Mirelle Santiago" /><div className="mirelle-status-loader" aria-hidden="true"><i /><i /><i /></div><h1>{title}</h1>{detail && <p>{detail}</p>}{detail ? <Link className="mirelle-status-back" to="/turnos/mirelle">Tentar novamente</Link> : <small>Preparando seu espaço de atendimento.</small>}</div></main>;
  return <main className="directory"><span className="eyebrow">INDULIRU · TURNOS</span><h1>{title}</h1>{detail && <p>{detail}</p>}<Link className="button" to="/">{portuguese ? 'Voltar ao início' : 'Ir al inicio'}</Link></main>;
}
function PanelRedirect({ to }) { useEffect(() => { window.location.replace(`${to}${window.location.search}`); }, [to]); return <Status title="Abriendo el panel…" />; }

export default function App() { return <Routes><Route path="/" element={<Home />} /><Route path="/admin" element={<PanelRedirect to="https://induliru.com/turnos/admin/" />} /><Route path="/adminadmin" element={<PanelRedirect to="https://gadielma.github.io/turnos/adminadmin/" />} /><Route path="/:slug" element={<BookingPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes>; }
