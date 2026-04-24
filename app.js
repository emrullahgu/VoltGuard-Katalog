/* VoltGuard Online Text Editor — app.js
 * Full-featured rich text editor with integrated signature drawing.
 * Uses standard document.execCommand for formatting (widely supported),
 * plus custom handlers for links, tables, images, signatures, find/replace,
 * autosave, theme, and file import/export.
 */
(function () {
  'use strict';

  // ----- State -----
  const STORAGE_KEY = 'voltguard-editor-content';
  const THEME_KEY = 'voltguard-editor-theme';
  let savedSelection = null;
  let autosaveTimer = null;

  // ----- Helpers -----
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const editor = $('#editor');
  const saveStatus = $('#saveStatus');

  function setSaveStatus(text, cls) {
    saveStatus.textContent = text;
    saveStatus.classList.remove('saving', 'saved');
    if (cls) saveStatus.classList.add(cls);
  }

  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      savedSelection = sel.getRangeAt(0).cloneRange();
    }
  }
  function restoreSelection() {
    if (!savedSelection) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
    return true;
  }
  function focusEditor() {
    editor.focus();
    restoreSelection();
  }

  function exec(cmd, value) {
    focusEditor();
    try {
      document.execCommand(cmd, false, value);
    } catch (e) {
      console.warn('execCommand failed', cmd, e);
    }
    scheduleAutosave();
    updateCounts();
    updateToolbarState();
  }

  // Insert an arbitrary HTML node at the current selection (inside editor).
  function insertNodeAtCaret(node) {
    focusEditor();
    const sel = window.getSelection();
    let range;
    if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0);
      range.deleteContents();
    } else {
      range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
    }
    range.insertNode(node);
    // Move caret after the inserted node
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    scheduleAutosave();
    updateCounts();
  }

  // ----- Autosave -----
  function scheduleAutosave() {
    setSaveStatus('Değişiklikler kaydediliyor…', 'saving');
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, editor.innerHTML);
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setSaveStatus(`Kaydedildi · ${hh}:${mm}`, 'saved');
      } catch (e) {
        setSaveStatus('Otomatik kayıt başarısız', '');
      }
    }, 600);
  }

  function loadAutosaved() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) {
        editor.innerHTML = saved;
      }
    } catch (e) { /* ignore */ }
  }

  // ----- Word / char count -----
  function updateCounts() {
    const text = (editor.innerText || '').replace(/\u00a0/g, ' ');
    const charCount = text.length;
    const words = text.trim().length ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    $('#wordCount').textContent = `${words} kelime`;
    $('#charCount').textContent = `${charCount} karakter`;

    const sel = window.getSelection();
    if (sel && sel.toString().length && editor.contains(sel.anchorNode)) {
      const selText = sel.toString();
      const selWords = selText.trim().length ? selText.trim().split(/\s+/).filter(Boolean).length : 0;
      $('#selectionInfo').textContent = `Seçim: ${selText.length} karakter · ${selWords} kelime`;
    } else {
      $('#selectionInfo').textContent = 'Seçim yok';
    }
  }

  // ----- Toolbar active state -----
  const STATE_CMDS = ['bold', 'italic', 'underline', 'strikeThrough',
    'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
    'insertUnorderedList', 'insertOrderedList', 'subscript', 'superscript'];

  function updateToolbarState() {
    for (const cmd of STATE_CMDS) {
      const btn = document.querySelector(`.tool[data-cmd="${cmd}"]`);
      if (!btn) continue;
      let active = false;
      try { active = document.queryCommandState(cmd); } catch (e) {}
      btn.classList.toggle('active', !!active);
    }
    // Block select sync
    try {
      const block = (document.queryCommandValue('formatBlock') || '').toLowerCase().replace(/[<>]/g, '');
      const sel = $('#blockSelect');
      if (sel && block && Array.from(sel.options).some(o => o.value === block)) {
        sel.value = block;
      }
    } catch (e) {}
  }

  // ----- Menus -----
  function setupMenus() {
    const menuBtns = $$('.menu-btn');
    menuBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const menuId = btn.dataset.menu;
        const dropdown = $(`.menu-dropdown[data-menu-for="${menuId}"]`);
        const wasOpen = dropdown.classList.contains('open');
        closeAllMenus();
        if (!wasOpen) {
          dropdown.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
    document.addEventListener('click', closeAllMenus);
    // Delegate menu items
    $$('.menu-dropdown').forEach(dd => {
      dd.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-cmd]');
        if (!b) return;
        handleCommand(b.dataset.cmd);
        closeAllMenus();
      });
    });
  }
  function closeAllMenus() {
    $$('.menu-dropdown').forEach(d => d.classList.remove('open'));
    $$('.menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
  }

  // ----- Command dispatcher -----
  function handleCommand(cmd, value) {
    switch (cmd) {
      case 'bold':
      case 'italic':
      case 'underline':
      case 'strikeThrough':
      case 'subscript':
      case 'superscript':
      case 'justifyLeft':
      case 'justifyCenter':
      case 'justifyRight':
      case 'justifyFull':
      case 'insertUnorderedList':
      case 'insertOrderedList':
      case 'outdent':
      case 'indent':
      case 'removeFormat':
      case 'undo':
      case 'redo':
      case 'selectAll':
      case 'unlink':
        exec(cmd, value);
        break;

      case 'cut':
      case 'copy':
        focusEditor();
        try { document.execCommand(cmd); } catch (e) { /* may require user gesture */ }
        break;

      case 'paste-plain':
        // Can't directly trigger paste; prompt user via keyboard shortcut hint.
        alert('Düz metin olarak yapıştırmak için Ctrl+Shift+V kısayolunu kullanın.');
        break;

      case 'file-new':
        if (confirm('Yeni belge oluşturulsun mu? Kaydedilmemiş değişiklikler kaybolur.')) {
          editor.innerHTML = '<p><br></p>';
          try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
          setSaveStatus('Yeni belge', '');
          updateCounts();
        }
        break;

      case 'file-open':
        $('#fileInput').click();
        break;

      case 'file-save-html':
        downloadFile('belge.html', buildHtmlDocument(editor.innerHTML), 'text/html;charset=utf-8');
        break;

      case 'file-save-txt':
        downloadFile('belge.txt', editor.innerText, 'text/plain;charset=utf-8');
        break;

      case 'file-print':
        window.print();
        break;

      case 'insert-link':
        saveSelection();
        openLinkModal();
        break;
      case 'insert-image':
        $('#imgInput').click();
        break;
      case 'insert-table':
        saveSelection();
        openModal('#tableModal');
        break;
      case 'insert-hr':
        exec('insertHorizontalRule');
        break;
      case 'insert-signature':
        saveSelection();
        openSignatureModal();
        break;

      case 'find':
        saveSelection();
        openModal('#findModal');
        $('#findText').focus();
        break;

      case 'toggle-theme':
        toggleTheme();
        break;
      case 'toggle-fullscreen':
        toggleFullscreen();
        break;
    }
  }

  // ----- Toolbar wiring -----
  function setupToolbar() {
    $$('.tool[data-cmd]').forEach(btn => {
      btn.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
      btn.addEventListener('click', () => handleCommand(btn.dataset.cmd));
    });

    $('#blockSelect').addEventListener('change', (e) => {
      const v = e.target.value;
      if (v) exec('formatBlock', v.toUpperCase() === 'P' ? 'P' : v);
    });
    $('#fontSelect').addEventListener('change', (e) => {
      const v = e.target.value;
      if (v) exec('fontName', v);
      e.target.selectedIndex = 0;
    });
    $('#sizeSelect').addEventListener('change', (e) => {
      const v = e.target.value;
      if (v) exec('fontSize', v);
    });
    $('#foreColor').addEventListener('input', (e) => exec('foreColor', e.target.value));
    $('#backColor').addEventListener('input', (e) => {
      // "hiliteColor" works in most browsers; fallback to "backColor"
      try { exec('hiliteColor', e.target.value); }
      catch (err) { exec('backColor', e.target.value); }
    });
  }

  // ----- File I/O -----
  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function buildHtmlDocument(innerHtml) {
    return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Belge</title>
<style>
  body { font-family: Georgia, "Times New Roman", serif; line-height: 1.6; max-width: 860px; margin: 2em auto; padding: 0 1em; color: #1e2330; }
  h1,h2,h3,h4 { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
  blockquote { border-left: 4px solid #2a5dff; margin: 0 0 1em; padding: .25em 1em; background: #f5f7ff; }
  pre { background: #f1f3f7; border: 1px solid #e1e4ec; padding: 10px 14px; border-radius: 4px; overflow-x:auto; font-family: "Courier New", monospace; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #c9cfdc; padding: 6px 10px; }
  th { background: #eef1f8; text-align: left; }
  img { max-width: 100%; height: auto; }
  .signature { display: inline-block; margin: 8px 0; max-width: 360px; }
  .signature img { max-width: 100%; height: auto; display: block; }
  hr { border: 0; border-top: 1px solid #d0d6e2; margin: 1.5em 0; }
</style>
</head>
<body>
${innerHtml}
</body>
</html>`;
  }

  function setupFileInputs() {
    $('#fileInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || '');
        if (/\.html?$/i.test(file.name)) {
          // Try to extract the <body> so we don't replace our own document structure.
          const match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
          const raw = match ? match[1] : text;
          editor.innerHTML = sanitizeHtml(raw);
        } else {
          // Plain text — preserve line breaks.
          const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          editor.innerHTML = escaped
            .split(/\r?\n\r?\n/)
            .map(p => `<p>${p.replace(/\r?\n/g, '<br>')}</p>`)
            .join('');
        }
        scheduleAutosave();
        updateCounts();
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    $('#imgInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = document.createElement('img');
        img.src = String(reader.result);
        img.alt = file.name;
        insertNodeAtCaret(img);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  }

  // ----- Modals -----
  function openModal(selector) {
    const m = $(selector);
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
  }
  function closeModal(m) {
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  }
  function setupModals() {
    $$('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target.matches('[data-close], .modal-backdrop')) {
          closeModal(modal);
        }
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.modal.open').forEach(closeModal);
      }
    });
  }

  // ----- Link modal -----
  function openLinkModal() {
    const selText = window.getSelection().toString();
    $('#linkText').value = selText || '';
    $('#linkUrl').value = 'https://';
    openModal('#linkModal');
    setTimeout(() => $('#linkUrl').focus(), 30);
  }
  function setupLinkModal() {
    $('#linkInsert').addEventListener('click', () => {
      const text = $('#linkText').value.trim();
      let url = $('#linkUrl').value.trim();
      if (!url) return;
      // Basic URL safety: reject javascript: and other dangerous schemes.
      const lower = url.toLowerCase();
      if (/^\s*(javascript|data|vbscript|file):/i.test(lower)) {
        alert('Bu URL şeması güvenlik nedeniyle kabul edilmiyor.');
        return;
      }
      if (!/^([a-z]+:)?\/\//i.test(url) && !url.startsWith('mailto:') && !url.startsWith('#') && !url.startsWith('/')) {
        url = 'https://' + url;
      }

      focusEditor();
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.toString()) {
        // Wrap existing selection
        exec('createLink', url);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.textContent = text || url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        insertNodeAtCaret(a);
      }
      // Enforce target/rel on created links
      $$('#editor a').forEach(a => {
        if (/^https?:\/\//i.test(a.getAttribute('href') || '')) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
      });
      closeModal($('#linkModal'));
    });
  }

  // ----- Table modal -----
  function setupTableModal() {
    $('#tableInsert').addEventListener('click', () => {
      const rows = Math.max(1, Math.min(50, parseInt($('#tableRows').value, 10) || 3));
      const cols = Math.max(1, Math.min(20, parseInt($('#tableCols').value, 10) || 3));
      const header = $('#tableHeader').checked;

      const table = document.createElement('table');
      let html = '';
      if (header) {
        html += '<thead><tr>';
        for (let c = 0; c < cols; c++) html += `<th>Başlık ${c + 1}</th>`;
        html += '</tr></thead>';
      }
      html += '<tbody>';
      for (let r = 0; r < rows; r++) {
        html += '<tr>';
        for (let c = 0; c < cols; c++) html += '<td><br></td>';
        html += '</tr>';
      }
      html += '</tbody>';
      table.innerHTML = html;

      focusEditor();
      restoreSelection();
      insertNodeAtCaret(table);
      // Insert trailing paragraph for continued typing
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      table.parentNode.insertBefore(p, table.nextSibling);
      closeModal($('#tableModal'));
    });
  }

  // ----- Find & Replace -----
  function setupFindModal() {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    function doReplace(all) {
      const find = $('#findText').value;
      const repl = $('#replaceText').value;
      const cs = $('#findCase').checked;
      if (!find) return;
      const re = new RegExp(esc(find), cs ? (all ? 'g' : '') : (all ? 'gi' : 'i'));

      // Replace only within text nodes to preserve markup.
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null);
      const toProcess = [];
      while (walker.nextNode()) toProcess.push(walker.currentNode);
      let replaced = 0;
      for (const node of toProcess) {
        if (!node.nodeValue) continue;
        if (re.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue.replace(re, () => { replaced++; return repl; });
          if (!all) break;
        }
        re.lastIndex = 0;
      }
      if (replaced === 0) {
        setSaveStatus(`"${find}" bulunamadı`, '');
      } else {
        setSaveStatus(`${replaced} eşleşme değiştirildi`, 'saved');
        scheduleAutosave();
        updateCounts();
      }
    }

    $('#replaceOne').addEventListener('click', () => doReplace(false));
    $('#replaceAll').addEventListener('click', () => doReplace(true));
  }

  // ----- Signature -----
  // Module-level callback for signature canvas resize, set up in setupSignatureModal.
  let signatureResize = null;

  function setupSignatureModal() {
    const canvas = $('#signatureCanvas');
    const ctx = canvas.getContext('2d');
    const transparentChk = $('#sigTransparent');
    const colorInput = $('#sigColor');
    const widthInput = $('#sigWidth');

    let drawing = false;
    let hasInk = false;
    let lastX = 0, lastY = 0;

    function resizeCanvas() {
      // Keep the drawing buffer crisp for the displayed CSS size.
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      redrawBackground();
    }

    function redrawBackground() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      if (!transparentChk.checked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }

    function clearSignature() {
      hasInk = false;
      redrawBackground();
    }

    function pointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function startDraw(e) {
      e.preventDefault();
      drawing = true;
      const p = pointerPos(e);
      lastX = p.x; lastY = p.y;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = colorInput.value;
      ctx.lineWidth = parseFloat(widthInput.value) || 2.5;
      // Put a dot so single-click leaves a mark.
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = colorInput.value;
      ctx.fill();
      hasInk = true;
    }
    function moveDraw(e) {
      if (!drawing) return;
      e.preventDefault();
      const p = pointerPos(e);
      ctx.strokeStyle = colorInput.value;
      ctx.lineWidth = parseFloat(widthInput.value) || 2.5;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
      hasInk = true;
    }
    function endDraw() { drawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    transparentChk.addEventListener('change', () => {
      // Preserve strokes when toggling: snapshot, redo background, restore strokes.
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      redrawBackground();
      ctx.putImageData(snap, 0, 0);
    });

    $('#sigClear').addEventListener('click', clearSignature);

    $('#sigInsert').addEventListener('click', () => {
      if (!hasInk) {
        alert('Lütfen önce imzanızı çizin.');
        return;
      }
      // If transparent, export PNG as-is (canvas is already transparent).
      // If not, export with the white background we drew.
      const dataUrl = canvas.toDataURL('image/png');

      const wrap = document.createElement('span');
      wrap.className = 'signature';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = 'İmza';
      wrap.appendChild(img);

      focusEditor();
      restoreSelection();
      insertNodeAtCaret(wrap);
      closeModal($('#signatureModal'));
    });

    // Expose resize so openSignatureModal can call it after the modal is visible.
    signatureResize = () => { resizeCanvas(); clearSignature(); };
  }

  function openSignatureModal() {
    openModal('#signatureModal');
    // Must resize after the element is visible so getBoundingClientRect is correct.
    requestAnimationFrame(() => { if (signatureResize) signatureResize(); });
  }

  // ----- Theme -----
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(cur);
  }
  function loadTheme() {
    let t = 'light';
    try { t = localStorage.getItem(THEME_KEY) || 'light'; } catch (e) {}
    applyTheme(t);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // ----- Paste handling: strip dangerous content, keep basic formatting -----
  function setupPasteHandler() {
    editor.addEventListener('paste', (e) => {
      // Shift = plain text paste
      if (e.shiftKey) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
        return;
      }
      const html = (e.clipboardData || window.clipboardData).getData('text/html');
      if (html) {
        e.preventDefault();
        const cleaned = sanitizeHtml(html);
        document.execCommand('insertHTML', false, cleaned);
      }
    });
  }

  // Minimal HTML sanitizer using a strict tag + attribute whitelist.
  // Unknown tags are unwrapped (children preserved as text/elements).
  // Only safe URL schemes are allowed on href/src.
  const ALLOWED_TAGS = new Set([
    'a','abbr','b','blockquote','br','caption','code','col','colgroup','div',
    'em','figcaption','figure','h1','h2','h3','h4','h5','h6','hr','i','img',
    'li','mark','ol','p','pre','s','small','span','strike','strong','sub','sup',
    'table','tbody','td','tfoot','th','thead','tr','u','ul','font'
  ]);
  // Attribute whitelist per tag; '*' applies to all allowed tags.
  const ALLOWED_ATTRS = {
    '*': new Set(['class','style','title','dir','lang']),
    'a': new Set(['href','target','rel','name']),
    'img': new Set(['src','alt','width','height']),
    'td': new Set(['colspan','rowspan','align','valign']),
    'th': new Set(['colspan','rowspan','align','valign','scope']),
    'col': new Set(['span','width']),
    'colgroup': new Set(['span']),
    'table': new Set(['border','cellpadding','cellspacing','align','width']),
    'font': new Set(['color','face','size']),
    'ol': new Set(['start','type']),
    'li': new Set(['value']),
  };
  // Very small CSS allow-list for inline style; drops url(...) and expression(...).
  const CSS_DANGEROUS = /(url\s*\(|expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding)/i;

  function isSafeUrl(url, allowDataImage) {
    const v = String(url || '').trim();
    if (!v) return false;
    // Relative URLs, fragments, mailto, tel are fine.
    if (/^(#|\/|\.\.?\/|mailto:|tel:)/i.test(v)) return true;
    // http/https/ftp
    if (/^(https?|ftp):/i.test(v)) return true;
    // data:image/... only when explicitly allowed (for <img>)
    if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|svg\+xml|bmp);/i.test(v)) return true;
    return false;
  }

  function sanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html);

    const walk = (node) => {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === 8) { // comment
          child.remove();
          continue;
        }
        if (child.nodeType !== 1) continue;

        const tag = child.tagName.toLowerCase();

        // Drop dangerous tags entirely (including content for script/style/iframe/etc.)
        if (tag === 'script' || tag === 'style' || tag === 'iframe' ||
            tag === 'object' || tag === 'embed' || tag === 'link' ||
            tag === 'meta' || tag === 'base' || tag === 'form' ||
            tag === 'input' || tag === 'button' || tag === 'select' ||
            tag === 'textarea' || tag === 'svg' || tag === 'math') {
          child.remove();
          continue;
        }

        // Unknown tag: unwrap (keep children as siblings).
        if (!ALLOWED_TAGS.has(tag)) {
          walk(child);
          while (child.firstChild) child.parentNode.insertBefore(child.firstChild, child);
          child.remove();
          continue;
        }

        // Filter attributes.
        const tagAllowed = ALLOWED_ATTRS[tag];
        const globalAllowed = ALLOWED_ATTRS['*'];
        for (const attr of Array.from(child.attributes)) {
          const name = attr.name.toLowerCase();
          const val = attr.value;

          // Strip all event handlers (on*) and xml: / xmlns: etc.
          if (name.startsWith('on') || name.startsWith('xmlns') || name === 'xml:base') {
            child.removeAttribute(attr.name);
            continue;
          }
          // data-* attributes allowed.
          if (name.startsWith('data-')) continue;

          const allowed = globalAllowed.has(name) || (tagAllowed && tagAllowed.has(name));
          if (!allowed) {
            child.removeAttribute(attr.name);
            continue;
          }

          // URL attributes need scheme validation.
          if (name === 'href' || name === 'src') {
            const allowDataImage = (tag === 'img' && name === 'src');
            if (!isSafeUrl(val, allowDataImage)) {
              child.removeAttribute(attr.name);
              continue;
            }
          }
          // Strip dangerous CSS.
          if (name === 'style' && CSS_DANGEROUS.test(val)) {
            child.removeAttribute(attr.name);
            continue;
          }
          // target=_blank must have rel=noopener
          if (tag === 'a' && name === 'target' && /_blank/i.test(val)) {
            child.setAttribute('rel', 'noopener noreferrer');
          }
        }

        walk(child);
      }
    };
    walk(template.content);
    return template.innerHTML;
  }

  // ----- Keyboard shortcuts -----
  function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;
      const k = e.key.toLowerCase();
      if (e.altKey && k === 's') {
        e.preventDefault(); handleCommand('insert-signature'); return;
      }
      if (e.altKey && k === 'n') {
        e.preventDefault(); handleCommand('file-new'); return;
      }
      switch (k) {
        case 's': e.preventDefault(); handleCommand('file-save-html'); break;
        case 'o': e.preventDefault(); handleCommand('file-open'); break;
        case 'p': e.preventDefault(); handleCommand('file-print'); break;
        case 'f': e.preventDefault(); handleCommand('find'); break;
        // Bold/italic/underline/z/y/a are handled natively by contenteditable; we just update UI.
      }
    });
  }

  // ----- Init -----
  function init() {
    loadTheme();
    loadAutosaved();
    setupMenus();
    setupToolbar();
    setupFileInputs();
    setupModals();
    setupLinkModal();
    setupTableModal();
    setupFindModal();
    setupSignatureModal();
    setupPasteHandler();
    setupShortcuts();

    editor.addEventListener('input', () => { scheduleAutosave(); updateCounts(); });
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === editor) {
        saveSelection();
        updateCounts();
        updateToolbarState();
      }
    });

    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, editor.innerHTML); } catch (e) {}
    });

    updateCounts();
    updateToolbarState();
    setSaveStatus('Hazır', '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
