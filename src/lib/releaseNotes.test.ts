import { parseInline, parseMarkdown } from './releaseNotes';

describe('parseInline', () => {
  it('keeps plain text as a single token', () => {
    expect(parseInline('nothing special')).toEqual([{ text: 'nothing special' }]);
  });

  it('marks bold runs', () => {
    expect(parseInline('a **b** c')).toEqual([{ text: 'a ' }, { text: 'b', bold: true }, { text: ' c' }]);
  });

  it('marks inline code', () => {
    expect(parseInline('use `npm test`')).toEqual([{ text: 'use ' }, { text: 'npm test', code: true }]);
  });

  it('turns markdown links into text plus url', () => {
    expect(parseInline('see [the PR](https://github.com/x/y/pull/1)')).toEqual([
      { text: 'see ' },
      { text: 'the PR', url: 'https://github.com/x/y/pull/1' },
    ]);
  });

  it('links bare urls and strips the scheme from their label', () => {
    expect(parseInline('in https://github.com/x/y/pull/1')).toEqual([
      { text: 'in ' },
      { text: 'github.com/x/y/pull/1', url: 'https://github.com/x/y/pull/1' },
    ]);
  });
});

describe('parseMarkdown', () => {
  const body = [
    "## What's Changed",
    '* feat(brand): redesign logo by @MichalDakowicz in https://github.com/x/y/pull/1',
    '',
    '---',
    '',
    '**Full Changelog**: https://github.com/x/y/compare/v1.4...v2.0',
  ].join('\r\n');

  it('classifies headings, bullets and paragraphs', () => {
    expect(parseMarkdown(body).map((block) => block.kind)).toEqual(['heading', 'bullet', 'paragraph']);
  });

  it('strips the markdown markers from block text', () => {
    const [heading, bullet] = parseMarkdown(body);
    expect(heading.tokens.map((token) => token.text).join('')).toBe("What's Changed");
    expect(bullet.tokens[0].text).toBe('feat(brand): redesign logo by @MichalDakowicz in ');
  });

  it('drops blank lines and horizontal rules', () => {
    expect(parseMarkdown('a\n\n---\n\n***\n\nb')).toHaveLength(2);
  });

  it('handles numbered lists as bullets', () => {
    expect(parseMarkdown('1. first\n2. second').every((block) => block.kind === 'bullet')).toBe(true);
  });

  it('caps the number of blocks', () => {
    const long = Array.from({ length: 40 }, (_, i) => `* item ${i}`).join('\n');
    expect(parseMarkdown(long, 5)).toHaveLength(5);
  });

  it('returns nothing for an empty body', () => {
    expect(parseMarkdown('')).toEqual([]);
  });
});
