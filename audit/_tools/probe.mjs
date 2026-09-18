/**
 * The in-page forensic probe.
 *
 * Serialised into the page and run there, so every value it returns is a
 * COMPUTED value as the browser resolved it — never an authored class name.
 * Config files state intent; this records what the user actually receives.
 *
 * It emits three things rather than a dump of every element, because a dump of
 * every element is 1.9MB per page/viewport and answers no question directly:
 *
 *   tokens     — frequency map per property: value -> count + example selectors.
 *                This is what proves "section padding takes 11 distinct values".
 *   components — full per-instance records, but only for the recurring component
 *                types the inconsistency matrix compares (button, card, chip,
 *                input, heading, link, section, image).
 *   defects    — only the elements that FAIL something: low contrast, text over
 *                an image, broken/oversized image, tiny touch target, overflow.
 */
export const probe = () => {
  /* ---------- colour maths (WCAG 2.2 relative luminance) ---------- */
  const parseColor = (c) => {
    if (!c) return null;
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x.trim()));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => {
    if (!fg || !bg) return null;
    const L1 = lum(fg), L2 = lum(bg);
    const hi = Math.max(L1, L2), lo = Math.min(L1, L2);
    return +(((hi + 0.05) / (lo + 0.05)).toFixed(2));
  };
  const hex = (c) => {
    const p = parseColor(c);
    if (!p) return String(c);
    if (p.a < 1) return `rgba(${p.r},${p.g},${p.b},${+p.a.toFixed(2)})`;
    const h = (n) => Math.round(n).toString(16).padStart(2, '0');
    return `#${h(p.r)}${h(p.g)}${h(p.b)}`.toUpperCase();
  };

  /** Walk ancestors for the first opaque background; note any image en route. */
  const effectiveBg = (el) => {
    let node = el, overImage = false;
    while (node && node.nodeType === 1) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') overImage = true;
      const c = parseColor(s.backgroundColor);
      if (c && c.a > 0.95) return { color: s.backgroundColor, overImage };
      node = node.parentElement;
    }
    return { color: 'rgb(255,255,255)', overImage };
  };

  const pathOf = (el) => {
    const parts = [];
    let node = el;
    for (let i = 0; node && node.nodeType === 1 && i < 4; i += 1) {
      let seg = node.tagName.toLowerCase();
      if (node.id) { parts.unshift(`${seg}#${node.id}`); break; }
      const cls = (typeof node.className === 'string' ? node.className : '')
        .trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
      if (cls) seg += `.${cls}`;
      parts.unshift(seg);
      node = node.parentElement;
    }
    return parts.join('>');
  };

  /* ---------- token frequency corpus ---------- */
  const TOKEN_PROPS = [
    'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform',
    'color', 'backgroundColor', 'borderTopWidth', 'borderTopStyle', 'borderTopColor',
    'borderTopLeftRadius', 'boxShadow', 'zIndex', 'transitionDuration', 'transitionTimingFunction',
    'maxWidth', 'gap',
  ];
  const SPACING_PROPS = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'];
  const tokens = {};
  const bump = (prop, value, sel) => {
    if (value === undefined || value === null) return;
    const v = String(value);
    if (v === 'none' || v === 'normal' || v === '0px' || v === 'auto' || v === 'rgba(0, 0, 0, 0)') {
      // Still counted — a zero is a decision — but under a compact key.
    }
    tokens[prop] = tokens[prop] || {};
    const slot = tokens[prop][v] || (tokens[prop][v] = { n: 0, where: [] });
    slot.n += 1;
    if (slot.where.length < 4) slot.where.push(sel);
  };

  /* ---------- classification for the inconsistency matrix ---------- */
  const classify = (el, s, r) => {
    const tag = el.tagName.toLowerCase();
    const cls = (typeof el.className === 'string' ? el.className : '').toLowerCase();
    const txt = (el.textContent || '').trim();
    if (['input', 'select', 'textarea'].includes(tag)) return 'input';
    if (tag === 'button' || (tag === 'a' && /rounded-full|rounded-xl|rounded-lg|btn|button/.test(cls)
      && s.backgroundColor !== 'rgba(0, 0, 0, 0)' && txt.length < 40 && r.height >= 24 && r.height <= 80)) return 'button';
    if (/^h[1-6]$/.test(tag)) return 'heading';
    if (tag === 'section' || (tag === 'div' && /section|container|wrapper/.test(cls) && r.width > 600)) return 'section';
    if (tag === 'img') return 'image';
    // Chip: small, pill-shaped, short text
    if (r.height > 0 && r.height <= 40 && txt.length > 0 && txt.length < 30
      && parseFloat(s.borderTopLeftRadius) >= 8 && s.display.includes('flex') === false
      && s.backgroundColor !== 'rgba(0, 0, 0, 0)') return 'chip';
    // Card: bordered or shadowed box of meaningful size
    if (r.width > 120 && r.height > 120
      && (s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0)
      && parseFloat(s.borderTopLeftRadius) > 0) return 'card';
    if (tag === 'a') return 'link';
    return null;
  };

  const components = { button: [], card: [], chip: [], input: [], heading: [], section: [], link: [], image: [] };
  const defects = { lowContrast: [], overImage: [], tinyTarget: [], brokenImage: [], oversizedImage: [], noAltImage: [] };

  const all = document.querySelectorAll('body *');
  let scanned = 0;
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'noscript', 'template', 'br', 'path', 'svg', 'g', 'defs', 'clippath'].includes(tag)) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) continue;
    scanned += 1;
    const sel = pathOf(el);

    for (const p of TOKEN_PROPS) {
      let v = s[p];
      if (p.toLowerCase().includes('color')) v = hex(v);
      bump(p, v, sel);
    }
    // Spacing is pooled into one distribution — the question is "what values exist", not "which side".
    for (const p of SPACING_PROPS) {
      const v = s[p];
      if (v && v !== '0px') bump('spacing', v, `${p}@${sel}`);
    }

    const ownText = [...el.childNodes].filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join(' ').trim();

    /* --- contrast, only where there is text --- */
    if (ownText && r.width > 0 && r.height > 0) {
      const bg = effectiveBg(el);
      const ratio = contrast(parseColor(s.color), parseColor(bg.color));
      const px = parseFloat(s.fontSize);
      const bold = parseInt(s.fontWeight, 10) >= 700;
      const large = px >= 24 || (px >= 18.66 && bold);
      const need = large ? 3 : 4.5;
      const entry = {
        sel, text: ownText.slice(0, 60), fg: hex(s.color), bg: hex(bg.color),
        ratio, need, fontSize: s.fontSize, weight: s.fontWeight,
      };
      if (bg.overImage) defects.overImage.push(entry);
      else if (ratio !== null && ratio < need) defects.lowContrast.push(entry);
    }

    /* --- interactive targets --- */
    const interactive = ['a', 'button', 'input', 'select', 'textarea', 'summary'].includes(tag)
      || el.getAttribute('role') === 'button';
    if (interactive && r.width > 0 && r.height > 0) {
      const min = Math.min(r.width, r.height);
      if (min < 24) {
        defects.tinyTarget.push({
          sel, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        });
      }
    }

    /* --- images --- */
    if (tag === 'img') {
      const src = (el.currentSrc || el.src || '').slice(-80);
      if (el.complete && el.naturalWidth === 0) defects.brokenImage.push({ sel, src });
      if (!el.hasAttribute('alt')) defects.noAltImage.push({ sel, src });
      if (el.naturalWidth > 0 && r.width > 0 && el.naturalWidth > r.width * 2.2) {
        defects.oversizedImage.push({
          sel, src, natural: `${el.naturalWidth}x${el.naturalHeight}`,
          displayed: `${Math.round(r.width)}x${Math.round(r.height)}`,
          wastedFactor: +(el.naturalWidth / r.width).toFixed(1),
        });
      }
    }

    /* --- component instances --- */
    const kind = classify(el, s, r);
    if (kind && components[kind] && components[kind].length < 60) {
      components[kind].push({
        sel,
        text: (el.textContent || '').trim().slice(0, 40) || undefined,
        w: Math.round(r.width), h: Math.round(r.height),
        font: `${s.fontSize}/${s.lineHeight} ${s.fontWeight}`,
        family: s.fontFamily.split(',')[0].replace(/["']/g, ''),
        tracking: s.letterSpacing,
        transform: s.textTransform,
        color: hex(s.color),
        bg: hex(s.backgroundColor),
        pad: `${s.paddingTop} ${s.paddingRight} ${s.paddingBottom} ${s.paddingLeft}`,
        radius: s.borderTopLeftRadius === s.borderBottomRightRadius
          ? s.borderTopLeftRadius
          : `${s.borderTopLeftRadius}/${s.borderTopRightRadius}/${s.borderBottomRightRadius}/${s.borderBottomLeftRadius}`,
        border: parseFloat(s.borderTopWidth) > 0 ? `${s.borderTopWidth} ${s.borderTopStyle} ${hex(s.borderTopColor)}` : 'none',
        shadow: s.boxShadow === 'none' ? 'none' : s.boxShadow.slice(0, 64),
        transition: s.transitionDuration === '0s' ? 'none' : `${s.transitionDuration} ${s.transitionTimingFunction}`,
        maxW: s.maxWidth,
        z: s.zIndex,
      });
    }
  }

  /* ---------- document structure ---------- */
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
    .map((h) => ({ level: +h.tagName[1], text: h.textContent.trim().slice(0, 70) }));
  const headingJumps = [];
  for (let i = 1; i < headings.length; i += 1) {
    if (headings[i].level - headings[i - 1].level > 1) {
      headingJumps.push(`h${headings[i - 1].level}->h${headings[i].level} at "${headings[i].text}"`);
    }
  }

  const imgs = [...document.querySelectorAll('img')];
  const vw = document.documentElement.clientWidth;
  const overflowers = [];
  for (const el of all) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 1) {
      overflowers.push({ sel: pathOf(el), right: +r.right.toFixed(1), w: +r.width.toFixed(1) });
    }
  }

  // Read what the pre-navigation observer collected (see cdp.mjs).
  const V = window.__wbVitals || { lcp: null, cls: 0, shifts: [], longTasks: [] };
  const nav = performance.getEntriesByType('navigation')[0];
  const paints = Object.fromEntries(performance.getEntriesByType('paint').map((p) => [p.name, +p.startTime.toFixed(0)]));

  return {
    url: location.pathname,
    title: document.title,
    viewport: { w: vw, h: document.documentElement.clientHeight },
    scrollWidth: document.documentElement.scrollWidth,
    overflowX: document.documentElement.scrollWidth - vw,
    scanned,
    tokens,
    components,
    defects: {
      lowContrast: defects.lowContrast.slice(0, 40),
      lowContrastCount: defects.lowContrast.length,
      overImage: defects.overImage.slice(0, 40),
      overImageCount: defects.overImage.length,
      tinyTarget: defects.tinyTarget.slice(0, 30),
      tinyTargetCount: defects.tinyTarget.length,
      brokenImage: defects.brokenImage,
      oversizedImage: defects.oversizedImage.slice(0, 20),
      oversizedImageCount: defects.oversizedImage.length,
      noAltImage: defects.noAltImage.slice(0, 20),
      noAltImageCount: defects.noAltImage.length,
    },
    headings,
    headingJumps,
    h1Count: document.querySelectorAll('h1').length,
    landmarks: Object.fromEntries(['header', 'nav', 'main', 'footer', 'aside']
      .map((t) => [t, document.querySelectorAll(t).length])),
    images: { total: imgs.length, lazy: imgs.filter((i) => i.getAttribute('loading') === 'lazy').length },
    overflowers: overflowers.slice(0, 20),
    vitals: {
      lcpMs: V.lcp ? V.lcp.ms : null,
      lcpElement: V.lcp ? `${V.lcp.tag || '?'}${V.lcp.cls ? '.' + V.lcp.cls : ''}` : null,
      lcpUrl: V.lcp ? String(V.lcp.url || '').slice(-70) : null,
      cls: +Number(V.cls || 0).toFixed(4),
      clsSources: (V.shifts || []).slice(0, 8),
      longTasks: V.longTasks || [],
      totalBlockingMs: (V.longTasks || []).reduce((a, d) => a + Math.max(0, d - 50), 0),
      fcpMs: paints['first-contentful-paint'] ?? null,
      domContentLoadedMs: nav ? +nav.domContentLoadedEventEnd.toFixed(0) : null,
      loadMs: nav ? +nav.loadEventEnd.toFixed(0) : null,
    },
    bodyText: document.body.innerText.slice(0, 5000),
  };
};
