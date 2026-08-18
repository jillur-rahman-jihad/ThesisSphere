import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Cite from 'citation-js';
import Citation from '../models/Citation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MLA_STYLE_ID = 'modern-language-association';
const MLA_STYLE_PATH = path.join(__dirname, '..', 'csl-styles', 'modern-language-association.csl');

const DOI_REGEX = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

const getTokenValue = (value) => (value ? String(value).trim() : '');

const normalizeUrl = (input) => {
  const trimmed = getTokenValue(input);
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('www.')) return `https://${trimmed}`;
  return `https://${trimmed}`;
};

const extractDoi = (value) => {
  const trimmed = getTokenValue(value);
  if (!trimmed) return '';

  const cleaned = trimmed
    .replace(/^doi:/i, '')
    .replace(/^https?:\/\/doi\.org\//i, '')
    .replace(/^https?:\/\/dx\.doi\.org\//i, '');

  const match = cleaned.match(DOI_REGEX);
  if (match) return match[0];

  if (/^10\./i.test(cleaned)) return cleaned;

  return '';
};

const parseDateParts = (value) => {
  if (!value) return null;

  if (Array.isArray(value) && value.length > 0) {
    return [
      Number(value[0]),
      value[1] ? Number(value[1]) : undefined,
      value[2] ? Number(value[2]) : undefined,
    ].filter((part) => Number.isFinite(part));
  }

  const text = String(value).trim();
  if (!text) return null;

  const parts = text.split(/[-/]/).map((part) => Number(part)).filter((part) => Number.isFinite(part));
  return parts.length > 0 ? parts : null;
};

const pickFirst = (...values) => values.find((value) => getTokenValue(value));

const extractMetaContent = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].trim();
  }

  return '';
};

const extractMetaContents = (html, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'ig');
  const matches = [];
  let match = regex.exec(html);
  while (match) {
    matches.push(match[1].trim());
    match = regex.exec(html);
  }
  return matches;
};

const extractHtmlTitle = (html) => {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : '';
};

const buildAuthorList = (authors = []) => authors
  .map((author) => getTokenValue(author))
  .filter(Boolean)
  .map((author) => {
    const parts = author.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return { literal: author };
    }

    return {
      given: parts.slice(0, -1).join(' '),
      family: parts.at(-1),
    };
  });

const determinePublicationDate = (message = {}) => {
  const dateParts = pickFirst(
    message?.issued?.['date-parts']?.[0],
    message?.published?.['date-parts']?.[0],
    message?.['published-print']?.['date-parts']?.[0],
    message?.['published-online']?.['date-parts']?.[0],
    message?.['created']?.['date-parts']?.[0],
  );

  return dateParts ? parseDateParts(dateParts) : null;
};

const buildCslEntry = ({
  type,
  title,
  authors,
  year,
  month,
  day,
  containerTitle,
  publisher,
  doi,
  url,
  accessDate,
}) => {
  const issuedParts = parseDateParts([year, month, day].filter(Boolean));

  const entry = {
    type,
    title: title || url || 'Untitled',
    author: buildAuthorList(authors),
    URL: url || '',
    DOI: doi || '',
    publisher: publisher || '',
    accessed: accessDate ? { 'date-parts': [accessDate] } : undefined,
  };

  if (containerTitle) {
    entry['container-title'] = [containerTitle];
  }

  if (issuedParts && issuedParts.length > 0) {
    entry.issued = { 'date-parts': [issuedParts] };
  }

  return entry;
};

const registerMlaStyle = () => {
  const csl = Cite.plugins.config.get('@csl');

  if (csl.styles.has(MLA_STYLE_ID)) {
    return;
  }

  const styleXml = fs.readFileSync(MLA_STYLE_PATH, 'utf8');
  csl.styles.add(MLA_STYLE_ID, styleXml);
};

registerMlaStyle();

const formatBibliography = (entry, template) => {
  const cite = new Cite(entry);
  const output = cite.format('bibliography', {
    template,
    format: 'text',
    lang: 'en-US',
  });

  return Array.isArray(output) ? output.join('\n') : String(output).trim();
};

const formatBibTeX = (entry) => {
  const cite = new Cite(entry);
  const output = cite.format('bibtex');
  return Array.isArray(output) ? output.join('\n') : String(output).trim();
};

const fetchJson = async (url, headers = {}) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

const fetchText = async (url, headers = {}, allowNonOk = false) => {
  const response = await fetch(url, {
    headers,
  });

  if (!response.ok && !allowNonOk) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.text();
};

const fetchCrossRefMetadata = async (doi) => {
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.message || null;
};

const fetchBibTeXForDoi = async (doi) => {
  try {
    return await fetchText(`https://doi.org/${encodeURIComponent(doi)}`, {
      Accept: 'application/x-bibtex',
    });
  } catch {
    return '';
  }
};

const fetchPageMetadata = async (sourceUrl) => {
  const normalizedUrl = normalizeUrl(sourceUrl);
  if (!normalizedUrl) return null;

  const html = await fetchText(normalizedUrl, {
    Accept: 'text/html,application/xhtml+xml',
  }, true);

  const citationAuthors = extractMetaContents(html, 'citation_author');
  const citationTitle = pickFirst(
    extractMetaContent(html, 'citation_title'),
    extractMetaContent(html, 'og:title'),
    extractHtmlTitle(html),
  );

  const citationDoi = pickFirst(
    extractMetaContent(html, 'citation_doi'),
    extractMetaContent(html, 'dc.identifier'),
    extractDoi(html),
  );

  const citationJournal = pickFirst(
    extractMetaContent(html, 'citation_journal_title'),
    extractMetaContent(html, 'citation_conference_title'),
    extractMetaContent(html, 'og:site_name'),
    new URL(normalizedUrl).hostname.replace(/^www\./i, ''),
  );

  const citationPublisher = pickFirst(
    extractMetaContent(html, 'citation_publisher'),
    extractMetaContent(html, 'og:site_name'),
    new URL(normalizedUrl).hostname.replace(/^www\./i, ''),
  );

  const publicationDate = pickFirst(
    extractMetaContent(html, 'citation_publication_date'),
    extractMetaContent(html, 'article:published_time'),
    extractMetaContent(html, 'og:updated_time'),
  );

  const dateParts = publicationDate ? publicationDate.split(/[-/]/).map((part) => Number(part)).filter((part) => Number.isFinite(part)) : [];

  return {
    title: citationTitle || normalizedUrl,
    authors: citationAuthors,
    doi: citationDoi || '',
    containerTitle: citationJournal || '',
    publisher: citationPublisher || '',
    year: dateParts[0] || null,
    month: dateParts[1] || null,
    day: dateParts[2] || null,
    url: normalizedUrl,
  };
};

const resolveCitationData = async (source) => {
  const inputValue = getTokenValue(source);
  const doi = extractDoi(inputValue);

  if (doi) {
    const crossRefMetadata = await fetchCrossRefMetadata(doi);

    if (crossRefMetadata) {
      const title = crossRefMetadata.title?.[0] || inputValue;
      const authors = (crossRefMetadata.author || []).map((author) => [author.given, author.family].filter(Boolean).join(' ').trim()).filter(Boolean);
      const issuedParts = determinePublicationDate(crossRefMetadata);
      const bibtex = await fetchBibTeXForDoi(doi);
      const url = crossRefMetadata.URL || `https://doi.org/${doi}`;

      const entry = buildCslEntry({
        type: 'article-journal',
        title,
        authors,
        year: issuedParts?.[0] || null,
        month: issuedParts?.[1] || null,
        day: issuedParts?.[2] || null,
        containerTitle: crossRefMetadata['container-title']?.[0] || '',
        publisher: crossRefMetadata.publisher || '',
        doi,
        url,
      });

      return {
        sourceInput: inputValue,
        sourceTitle: title,
        authors,
        year: issuedParts?.[0] || null,
        doi,
        sourceUrl: url,
        apa: formatBibliography(entry, 'apa'),
        mla: formatBibliography(entry, MLA_STYLE_ID),
        bibtex: bibtex || formatBibTeX(entry),
      };
    }
  }

  const pageMetadata = await fetchPageMetadata(inputValue);
  if (!pageMetadata) {
    throw new Error('Unable to retrieve citation metadata from the provided source.');
  }

  const entry = buildCslEntry({
    type: 'webpage',
    title: pageMetadata.title,
    authors: pageMetadata.authors,
    year: pageMetadata.year,
    month: pageMetadata.month,
    day: pageMetadata.day,
    containerTitle: pageMetadata.containerTitle,
    publisher: pageMetadata.publisher,
    doi: pageMetadata.doi,
    url: pageMetadata.url,
    accessDate: [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()],
  });

  return {
    sourceInput: inputValue,
    sourceTitle: pageMetadata.title,
    authors: pageMetadata.authors,
    year: pageMetadata.year,
    doi: pageMetadata.doi || '',
    sourceUrl: pageMetadata.url,
    apa: formatBibliography(entry, 'apa'),
    mla: formatBibliography(entry, MLA_STYLE_ID),
    bibtex: formatBibTeX(entry),
  };
};

export const generateCitation = async (req, res, next) => {
  try {
    const { source } = req.body;

    if (!source || !String(source).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a DOI or a link to a paper or article.',
      });
    }

    const citationData = await resolveCitationData(source);

    const citation = await Citation.create({
      userId: req.user._id,
      sourceInput: citationData.sourceInput,
      sourceTitle: citationData.sourceTitle,
      authors: citationData.authors,
      year: citationData.year,
      doi: citationData.doi,
      sourceUrl: citationData.sourceUrl,
      formats: {
        apa: citationData.apa,
        mla: citationData.mla,
        bibtex: citationData.bibtex,
      },
      generatedCitation: citationData.apa,
    });

    return res.status(201).json({
      success: true,
      message: 'Citation generated successfully.',
      data: citation,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserCitations = async (req, res, next) => {
  try {
    const citations = await Citation.find({ userId: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: citations,
    });
  } catch (error) {
    next(error);
  }
};
