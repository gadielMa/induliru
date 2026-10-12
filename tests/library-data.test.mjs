import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getAdjacentChapterTargets } from '../biblia/scripts/chapter-navigation.mjs';
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
