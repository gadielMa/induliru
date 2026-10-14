import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getAdjacentChapterTargets } from '../biblia/scripts/chapter-navigation.mjs';
import { findBookSummary } from '../biblia/scripts/book-summary.mjs';
import { findTextSearchMatches, normalizeSearchText } from '../biblia/scripts/search-utils.mjs';

const bibleData = new URL('../biblia/textos/rvr1909/', import.meta.url);
const order = ['mateo', 'marcos', 'lucas', 'juan', 'hechos'];
const orderedBooks = await Promise.all(order.map(async name => {
  const work = JSON.parse(await readFile(new URL(`${name}.es.json`, bibleData), 'utf8'));
  return { id: `rvr1909-${name}`, chapters: work.chapters };
}));

test('every chapter in the four Gospels and Acts has valid adjacent navigation', () => {
  for (let bookIndex = 0; bookIndex < orderedBooks.length; bookIndex++) {
    const book = orderedBooks[bookIndex];
    for (let chapterIndex = 0; chapterIndex < book.chapters.length; chapterIndex++) {
      const previousLast = bookIndex > 0 ? orderedBooks[bookIndex - 1].chapters.at(-1).number : null;
      const targets = getAdjacentChapterTargets({
        bookId: book.id,
        chapterIndex,
        chapters: book.chapters,
        orderedBooks,
        previousBookLastChapter: chapterIndex === 0 ? previousLast : null
      });
      const expectedPrevious = chapterIndex > 0
        ? { book: book.id, chapter: Number(book.chapters[chapterIndex - 1].number) }
        : bookIndex > 0
          ? { book: orderedBooks[bookIndex - 1].id, chapter: Number(previousLast) }
          : null;
      const expectedNext = chapterIndex < book.chapters.length - 1
        ? { book: book.id, chapter: Number(book.chapters[chapterIndex + 1].number) }
        : bookIndex < orderedBooks.length - 1
          ? { book: orderedBooks[bookIndex + 1].id, chapter: 1 }
          : null;
      assert.deepEqual(targets.previous && { book: targets.previous.book.id, chapter: targets.previous.chapter }, expectedPrevious, `${book.id} ${book.chapters[chapterIndex].number}: previous`);
      assert.deepEqual(targets.next && { book: targets.next.book.id, chapter: targets.next.chapter }, expectedNext, `${book.id} ${book.chapters[chapterIndex].number}: next`);
    }
  }
});

test('the last chapter of John advances to Acts 1, never to a nonexistent chapter', () => {
  const john = orderedBooks.find(book => book.id === 'rvr1909-juan');
  const targets = getAdjacentChapterTargets({ bookId: john.id, chapterIndex: john.chapters.length - 1, chapters: john.chapters, orderedBooks });
  assert.deepEqual({ book: targets.next.book.id, chapter: targets.next.chapter }, { book: 'rvr1909-hechos', chapter: 1 });
});

test('books outside the Gospels/Acts order still navigate between their own chapters', () => {
  const chapters = [{ number: 14 }, { number: 15 }, { number: 16 }];
  const targets = getAdjacentChapterTargets({ bookId: 'rvr1909-numeros', chapterIndex: 1, chapters, orderedBooks });
  assert.deepEqual({ book: targets.previous.book.id, chapter: targets.previous.chapter }, { book: 'rvr1909-numeros', chapter: 14 });
  assert.deepEqual({ book: targets.next.book.id, chapter: targets.next.chapter }, { book: 'rvr1909-numeros', chapter: 16 });
});

test('name search ignores accents and finds Gadiel/Gaddiel in Numbers 13:11', async () => {
  assert.equal(normalizeSearchText('SÁBANA Santa'), 'sabana santa');
  const index = JSON.parse(await readFile(new URL('../biblia/textos/search-index.json', import.meta.url), 'utf8'));
  const matches = findTextSearchMatches(index, 'Gadiel').filter(item => item.documentId === 'rvr1909-numeros');
  assert.ok(matches.some(item => item.chapter === 13 && item.verse === '11' && /Gaddiel hijo de Sodi/i.test(item.text)));
});

test('text search prioritizes Spanish matches before English while preserving their order', () => {
  const index = [
    { title: 'English first', language: 'en', text: 'Satan tempts' },
    { title: 'Spanish first', language: 'es', text: 'Satanás tienta' },
    { title: 'Spanish second', language: 'es', text: 'Satanás acusa' },
    { title: 'English second', language: 'en', text: 'Satan accuses' }
  ];
  const matches = findTextSearchMatches(index, 'satan');
  assert.deepEqual(matches.map(item => item.title), ['Spanish first', 'Spanish second', 'English first', 'English second']);
});

test('Spanish Psalms of Solomon contains all 18 psalms without placeholder chapters', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/psalms-solomon.es.json', import.meta.url), 'utf8'));
  assert.equal(work.chapters.length, 18);
  assert.equal(work.chapters.reduce((total, chapter) => total + chapter.verses.length, 0), 287);
  assert.ok(work.chapters.every(chapter => chapter.verses.length > 1));
  assert.match(work.chapters.find(chapter => chapter.number === 2).verses[1].text, /naciones extranjeras.*altar/i);
  assert.match(work.chapters.find(chapter => chapter.number === 17).verses.find(verse => verse.number === '24').text, /vara de hierro/i);
});

test('Spanish Apocryphon of John contains the complete 21-division working translation', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/apocryphon-juan.es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');

  assert.equal(work.chapters.length, 21);
  assert.equal(passages.length, 290);
  assert.ok(fullText.split(/\s+/).length > 7500);
  assert.doesNotMatch(work.translator, /resumen/i);
  assert.match(fullText, /Barbelo/);
  assert.match(fullText, /Yaldabaot/);
  assert.match(fullText, /creamos un hombre según la imagen de Dios/i);
  assert.match(work.chapters.at(-1).title, /Encargo final a Juan/);
});

test('Spanish Testament of Solomon contains all 130 Conybeare sections as a full working translation', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/testament-solomon-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');

  assert.equal(work.chapters.length, 13);
  assert.equal(passages.length, 130);
  assert.ok(fullText.split(/\s+/).length > 7000);
  assert.equal(work.localTextKind, 'full');
  assert.ok(passages.every(verse => verse.sourceSection >= 1 && verse.sourceSection <= 130));
  assert.match(fullText, /Ornias/);
  assert.match(fullText, /Salomón/);
  assert.doesNotMatch(fullText, /hellip|\{\{|<ref/i);
});

test('the Egerton, Oxyrhynchus, and Fayum gospel fragments are available as complete surviving text', async () => {
  const catalog = JSON.parse(await readFile(new URL('../biblia/textos/catalog.json', import.meta.url), 'utf8'));
  for (const [id, expectedChapters, expectedText] of [
    ['egerton-gospel-es', 4, /leproso/i],
    ['oxyrhynchus-840-es', 2, /pureza|limpio/i],
    ['fayyum-fragment-es', 1, /Pedro|ovejas/i]
  ]) {
    const entry = catalog.find(item => item.id === id);
    assert.ok(entry, `${id} appears in the reader catalog`);
    const work = JSON.parse(await readFile(new URL(`../biblia/textos/${entry.file}`, import.meta.url), 'utf8'));
    const fullText = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
    assert.equal(work.chapters.length, expectedChapters);
    assert.equal(work.localTextKind, 'full');
    assert.match(fullText, expectedText);
    assert.match(work.notes, /solo|unas pocas líneas|una hoja|fragment/i);
  }
});

test('Joseph and Asenath is accurately labeled as an expanded Spanish summary with a valid complete source link', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/jose-asanet-es.json', import.meta.url), 'utf8'));
  const chapterCount = work.chapters.length;
  const words = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ').split(/\s+/).filter(Boolean).length;

  assert.equal(chapterCount, 29);
  assert.ok(words > 1000);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /gospelstudies\.org\.uk.*joseph-and-asenath_brooks\.pdf/);
  assert.match(work.notes, /no debe confundirse con el texto íntegro/i);
  assert.doesNotMatch(work.chapters[0].verses[0].text, /águila|recién nacida/i);
});

test('Pseudo-Philo has an expanded Spanish guide spanning the 65 surviving narrative chapters', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/pseudo-filon-es.json', import.meta.url), 'utf8'));
  const words = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ').split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 18);
  assert.ok(words > 1000);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /sacred-texts\.com.*start-reading/);
  assert.match(work.notes, /65 capítulos/);
  assert.match(work.notes, /final conservado queda abrupto/);
});

test('Acts of John has an expanded Spanish guide that identifies its composite transmission', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/acts-john-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 8);
  assert.ok(words > 700);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /earlychristianwritings\.com\/text\/actsjohn\.html/);
  assert.match(work.notes, /comienzo.*perdido/i);
  assert.match(work.notes, /solo en latín/i);
  assert.match(fullText, /Ártemis/);
  assert.match(fullText, /Drusiana/);
  assert.match(fullText, /himno/);
});

test('Acts of Philip has an expanded Spanish guide that distinguishes its fragmentary Greek and Syriac transmission', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/acts-philip-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 10);
  assert.ok(words > 900);
  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.externalTextKind, 'partial');
  assert.match(work.externalTextUrl, /wesley\.nnu\.edu.*acts-of-philip/);
  assert.match(work.notes, /quince Hechos/);
  assert.match(work.notes, /solo en siríaco/);
  assert.match(fullText, /cabrito/);
  assert.match(fullText, /Jesús lo reprende/);
  assert.match(fullText, /Hierápolis/);
});

test('Hypostasis of the Archons has an expanded Spanish guide faithful to its own Coptic narrative', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/hypostasis-archons-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 12);
  assert.ok(words > 1000);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /gnosis\.org\/naghamm\/hypostas\.html/);
  assert.match(work.notes, /no la narración de Génesis/i);
  assert.match(fullText, /Mujer espiritual/);
  assert.match(fullText, /serpiente.*instructora/i);
  assert.match(fullText, /Norea/);
  assert.match(fullText, /Eleleth/);
});

test('On the Origin of the World has an expanded guide distinct from Hypostasis of the Archons', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/origin-world-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 14);
  assert.ok(words > 1200);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /earlychristianwritings\.com\/text\/originworld\.html/);
  assert.match(work.notes, /no es el mismo relato/i);
  assert.match(fullText, /Eros/);
  assert.match(fullText, /Fénix/);
  assert.match(fullText, /Eve de Vida/);
  assert.match(fullText, /Logos/);
  assert.match(fullText, /reino «sin rey»/);
});

test('Temple Scroll has an expanded Spanish guide instead of repeated placeholder columns', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/rollo-templo-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 7);
  assert.ok(words > 600);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.externalTextUrl, /qumran\.dev\/non_biblical\/11Q19/);
  assert.match(work.translationNote, /lagunas/i);
  assert.doesNotMatch(fullText, /Texto completo pendiente/);
  assert.match(fullText, /calendario/);
  assert.match(fullText, /Ley del Rey/);
  assert.match(fullText, /testimonio se interrumpe/);
});

test('Clementine Octateuch guide distinguishes the work from related Ethiopian and Greek collections', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/octateuco-clemente-es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 8);
  assert.ok(words > 800);
  assert.equal(work.localTextKind, 'summary');
  assert.match(work.sourceUrl, /ccdl\.claremont\.edu/);
  assert.match(work.translationNote, /Orit etíope/);
  assert.match(work.notes, /recensión copto-árabe/);
  assert.match(fullText, /Testamentum Domini/);
  assert.match(fullText, /127 cánones apostólicos/);
  assert.match(fullText, /mismo texto/i);
  assert.doesNotMatch(fullText, /Texto completo pendiente/);
});

test('Gospel of the Hebrews guide expands the fragments while flagging disputed attributions', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/evangelio-hebreos.es.json', import.meta.url), 'utf8'));
  const fullText = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 7);
  assert.ok(words > 800);
  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.externalTextKind, 'partial');
  assert.match(work.externalTextUrl, /gospelhebrews-mrjames\.html/);
  assert.match(work.notes, /asignación de algunas citas/i);
  assert.match(fullText, /Espíritu.*madre/i);
  assert.match(fullText, /Santiago/);
  assert.match(fullText, /Evangelio de Tomás/);
});

test('Gospel of the Nazarenes guide marks the title and fragment assignments as uncertain', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/evangelio-nazarenos.es.json', import.meta.url), 'utf8'));
  const fullText = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 7);
  assert.ok(words > 800);
  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.externalTextKind, 'partial');
  assert.match(work.externalTextUrl, /gospelhebrews-mrjames\.html/);
  assert.match(work.notes, /título solo aparece en fuentes medievales/i);
  assert.match(fullText, /albañil|trabajador manual/i);
  assert.match(fullText, /dintel/);
  assert.match(fullText, /Evangelio de los Hebreos/);
  assert.match(fullText, /no presenta una reconstrucción continua/i);
});

test('Gospel of the Ebionites guide summarizes Epiphanius while flagging his polemical lens', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/evangelio-ebionitas.es.json', import.meta.url), 'utf8'));
  const fullText = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 8);
  assert.ok(words > 900);
  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.externalTextKind, 'partial');
  assert.match(work.sourceUrl, /nasscal\.com/);
  assert.match(work.notes, /único testigo/i);
  assert.match(fullText, /torta de miel/);
  assert.match(fullText, /sacrificios/);
  assert.match(fullText, /armonía de los evangelios sinópticos/);
  assert.doesNotMatch(fullText, /texto íntegro disponible/i);
});

test('Testament of Isaac has an expanded guide while labeling the local source text as partial', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/testamento-isaac.es.json', import.meta.url), 'utf8'));
  const guideText = work.chapters.slice(0, 8).flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const guideTextWithExpansion = work.chapters.slice(0, -1).flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const allText = work.chapters.flatMap(chapter => chapter.verses).map(verse => verse.text).join(' ');
  const guideWords = guideText.split(/\s+/).filter(Boolean).length;
  const expandedGuideWords = guideTextWithExpansion.split(/\s+/).filter(Boolean).length;

  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.textCompleteness, 'partial');
  assert.ok(guideWords >= 900 && guideWords <= 1350);
  assert.ok(expandedGuideWords >= 3800 && expandedGuideWords <= 4300);
  assert.match(work.notes, /no está transcrita íntegramente/i);
  assert.match(work.chapters.at(-1).title, /Fragmento final/i);
  assert.match(work.externalTextUrl, /testament-of-abraham_box\.pdf/);
  assert.match(allText, /Abdemerouchos/);
  assert.match(allText, /versiones coptas/i);
});

test('Testament of Jacob guide distinguishes the Coptic work from James’s uncertain printed-book notice', async () => {
  const work = JSON.parse(await readFile(new URL('../biblia/textos/testamento-jacob.es.json', import.meta.url), 'utf8'));
  const passages = work.chapters.flatMap(chapter => chapter.verses);
  const fullText = passages.map(verse => verse.text).join(' ');
  const words = fullText.split(/\s+/).filter(Boolean).length;

  assert.equal(work.chapters.length, 9);
  assert.ok(words >= 1100 && words <= 1500);
  assert.equal(work.localTextKind, 'summary');
  assert.equal(work.textCompleteness, 'partial');
  assert.match(work.externalTextUrl, /testament-of-abraham_box\.pdf/);
  assert.match(work.notes, /versión copta/i);
  assert.match(work.notes, /no debe confundirse/i);
  assert.match(fullText, /Efraín y Manasés/);
  assert.match(fullText, /M. R. James/);
});

test('every reader-catalog work resolves to a book summary instead of the generic editorial notice', async () => {
  const catalog = JSON.parse(await readFile(new URL('../biblia/textos/catalog.json', import.meta.url), 'utf8'));
  const rows = JSON.parse(await readFile(new URL('../biblia/data.json', import.meta.url), 'utf8'));
  for (const entry of catalog) {
    const work = JSON.parse(await readFile(new URL(`../biblia/textos/${entry.file}`, import.meta.url), 'utf8'));
    const summary = findBookSummary({ entry, work, catalog, rows });
    assert.ok(summary.length > 40, `${entry.id} has a useful summary`);
    assert.doesNotMatch(summary, /Los números con letra/);
  }
});
