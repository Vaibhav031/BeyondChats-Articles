/**
 * Content enhancer service
 * - analyze formatting patterns from two reference texts (paragraph sentence counts, presence of headings/lists)
 * - apply similar structure to the original article without adding new facts or copying reference sentences
 * - returns enhanced plain-text article with improved sectioning and readability
 */

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function splitSentences(text) {
  // naive sentence splitter - keeps delimiters
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\(])|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function detectPatterns(refTexts = []) {
  // Analyze paragraph sentence counts, headings presence, list usage
  const results = { avgSentencesPerParagraph: 3, useHeadings: false, useLists: false };

  const paraSentenceCounts = [];
  let headingsCount = 0;
  let listsCount = 0;

  for (const t of refTexts) {
    if (!t) continue;
    const paragraphs = splitParagraphs(t);
    for (const p of paragraphs) {
      // heading detection: short line (<60 chars), no ending punctuation, lower ratio of verbs (simple heuristic)
      const isHeading = /^.{1,60}$/.test(p) && !/[.!?]$/.test(p) && p.split(' ').length <= 7;
      if (isHeading) headingsCount++;

      const sents = splitSentences(p);
      paraSentenceCounts.push(sents.length || 1);

      // list detection: presence of '-' or numbers at start of lines or many short lines
      if (/^[-*\u2022]|^\d+\./m.test(p) || p.split(/\n/).length > 3 && p.split(/\n/).every((l) => l.trim().length < 80)) {
        listsCount++;
      }
    }
  }

  if (paraSentenceCounts.length) results.avgSentencesPerParagraph = Math.max(1, Math.round(avg(paraSentenceCounts)));
  results.useHeadings = headingsCount > 0;
  results.useLists = listsCount > 0;

  return results;
}

function toTitleCase(phrase) {
  return phrase
    .split(/\s+/)
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ')
    .trim();
}

function createHeadingFromParagraph(paragraph) {
  // Create a short heading (6 words) derived from the paragraph without copying a full sentence
  const words = paragraph.replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const headingWords = words.slice(0, 6);
  const heading = headingWords.join(' ');
  return toTitleCase(heading || 'Overview');
}

function splitIntoParagraphsBySentenceCount(sentences, target) {
  const paras = [];
  let current = [];
  for (let i = 0; i < sentences.length; i++) {
    current.push(sentences[i]);
    const isLast = i === sentences.length - 1;
    if (current.length >= target || isLast) {
      paras.push(current.join(' '));
      current = [];
    }
  }
  return paras;
}

function breakLongSentence(sentence) {
  // Split long sentences on semicolons or long commas, or on ' and ' / ' but '
  if (sentence.length < 160) return [sentence];
  const parts = sentence.split(/;|,\s+and\s+|,\s+but\s+|\s+and\s+|\s+but\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length === 1) return [sentence];
  return parts;
}

/**
 * Enhance content using formatting hints from two reference texts
 * @param {string} original - original article text
 * @param {string} refA - reference article text A
 * @param {string} refB - reference article text B
 * @param {object} opts
 * @param {boolean} opts.forceHeadings - force headings even if refs don't have them
 * @returns {string} enhanced article text
 */
function enhanceContent(original, refA = '', refB = '', opts = {}) {
  if (!original || typeof original !== 'string') throw new Error('original text is required');

  const patterns = detectPatterns([refA || '', refB || '']);
  if (opts.forceHeadings) patterns.useHeadings = true;

  // Normalize original text
  const clean = original.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  // Split into sentences and also break overly long sentences
  const rawSentences = splitSentences(clean).map((s) => s.trim()).filter(Boolean);

  // Expand sentences where some are very long
  const sentences = rawSentences.flatMap((s) => breakLongSentence(s));

  // Determine paragraph sentence size
  const targetSents = Math.max(1, Math.min(6, patterns.avgSentencesPerParagraph || 3));

  // Build paragraphs of target size but make first paragraph shorter (1-2 sentences)
  const parasSentTarget = [];
  let idx = 0;
  // intro
  const introSize = Math.min(2, Math.max(1, Math.round(targetSents / 2)));
  if (sentences.length > 0) {
    parasSentTarget.push(sentences.slice(0, introSize).join(' '));
    idx = introSize;
  }
  while (idx < sentences.length) {
    const chunk = sentences.slice(idx, idx + targetSents).join(' ');
    parasSentTarget.push(chunk);
    idx += targetSents;
  }

  // Optionally insert headings derived from paragraph content
  const enhancedParts = [];
  parasSentTarget.forEach((p, i) => {
    // Skip adding a heading for the very first intro paragraph if it's brief
    if (patterns.useHeadings && i > 0) {
      const heading = createHeadingFromParagraph(p);
      enhancedParts.push(heading);
    }

    // Convert long sentences inside paragraph into smaller lines where appropriate for readability
    const paraSents = splitSentences(p).flatMap((s) => breakLongSentence(s)).map((s) => s.replace(/\s+/g, ' ').trim());

    // If refs use lists and paragraph contains enumerations (comma-separated lists), convert them to bullets
    const hasEnumeration = paraSents.some((s) => /,\s+[^,]+,\s+and\s+|(?:first|second|third)\b/i.test(s));
    if (patterns.useLists && hasEnumeration) {
      // create bullet list by splitting on commas and 'and'
      const items = paraSents
        .join(' ')
        .split(/,\s+|\band\b|\bplus\b/i)
        .map((it) => it.trim())
        .filter((it) => it.length > 20) // only keep substantive items
        .slice(0, 6);
      if (items.length > 1) {
        enhancedParts.push(items.map((it) => `- ${it}`).join('\n'));
        return; // skip adding paragraph body when converted to list
      }
    }

    // Otherwise keep paragraph text but ensure sentences are short and readable
    // Join sentences and wrap with single blank line between paragraphs
    const readablePara = paraSents.join(' ');
    enhancedParts.push(readablePara);
  });

  // Post-process: ensure headings are on their own lines and separated
  const final = enhancedParts
    .map((part) => {
      // Heuristic: treat a part as heading if it contains no sentence-ending punctuation and is short
      if (/^[A-Za-z0-9\s\-]{1,80}$/.test(part) && part.split(' ').length <= 8 && /[A-Z]/.test(part[0])) {
        return `\n${part}\n\n`;
      }
      return `\n${part}\n`;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return final;
}

module.exports = { enhanceContent };
