const SUPABASE_URL = 'https://jbrjsvkdnyzptkxnflbe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_L7rQxIHg2i7gbuozJrgfWg_NjD3Elz1';
const TABLE = 'soypobre_requests';
const BUCKET = 'soypobre-images';

const home = document.getElementById('home');
const formSection = document.getElementById('formSection');
const form = document.getElementById('helpForm');
const status = document.getElementById('status');
const submitButton = document.getElementById('submitButton');
const story = document.getElementById('story');
const photo = document.getElementById('photo');

function show(view) {
  home.hidden = view !== 'home';
  formSection.hidden = view !== 'form';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('startButton').addEventListener('click', () => show('form'));
document.getElementById('backButton').addEventListener('click', () => show('home'));
story.addEventListener('input', () => { document.getElementById('storyCount').textContent = story.value.length; });
photo.addEventListener('change', () => { document.getElementById('fileLabel').textContent = photo.files[0]?.name || 'Elegir una foto'; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  status.textContent = '';
  const cbu = document.getElementById('cbu').value.trim().replace(/\s/g, '');
  const alias = document.getElementById('alias').value.trim();
  const file = photo.files[0];
  if (!cbu && !alias) return setError('Completá tu CBU o tu Alias para poder recibir ayuda.');
  if (cbu && !/^\d{22}$/.test(cbu)) return setError('El CBU debe tener exactamente 22 dígitos.');
  if (file && (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024)) return setError('La foto debe ser JPG, PNG o WebP y pesar menos de 5 MB.');
  if (!document.getElementById('consent').checked) return setError('Necesitamos tu consentimiento para guardar estos datos.');
  submitButton.disabled = true;
  submitButton.firstChild.textContent = 'Guardando... ';
  let photoPath = null;
  try {
    if (!window.supabase) throw new Error('Supabase no está disponible');
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    if (file) {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      photoPath = `${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from(BUCKET).upload(photoPath, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
    }
    const insert = await supabase.from(TABLE).insert({ cbu: cbu || null, alias: alias || null, story: story.value.trim() || null, photo_path: photoPath });
    if (insert.error) throw insert.error;
    form.reset();
    document.getElementById('fileLabel').textContent = 'Elegir una foto';
    document.getElementById('storyCount').textContent = '0';
    show('home');
  } catch (error) {
    if (file && error && photoPath) await supabase.storage.from(BUCKET).remove([photoPath]);
    setError('No pudimos guardar tu historia. Probá de nuevo en unos segundos.');
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = 'Guardar mi historia ';
  }
});

function setError(message) { status.textContent = message; }
