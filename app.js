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
      // Prevent the button mousedown from stealing the editor's selection
      // before the command runs (important for selection-dependent commands
      // like case transforms, line height, find, etc.).
      dd.addEventListener('mousedown', (e) => {
        if (e.target.closest('button[data-cmd]')) e.preventDefault();
      });
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

      case 'file-save-md':
        downloadFile('belge.md', htmlToMarkdown(editor), 'text/markdown;charset=utf-8');
        break;

      case 'file-export-pdf':
        openModal('#pdfModal');
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
      case 'insert-pagebreak':
        insertPageBreak();
        break;
      case 'insert-symbol':
        saveSelection();
        openModal('#symbolModal');
        break;
      case 'insert-emoji':
        saveSelection();
        openModal('#emojiModal');
        break;
      case 'insert-date':
        insertDateTime('date');
        break;
      case 'insert-time':
        insertDateTime('time');
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

      case 'word-stats':
        openWordStats();
        break;

      case 'case-upper':
      case 'case-lower':
      case 'case-title':
      case 'case-sentence':
        transformCase(cmd.slice(5));
        break;

      case 'lh-1':    setLineHeight('1');    break;
      case 'lh-115':  setLineHeight('1.15'); break;
      case 'lh-15':   setLineHeight('1.5');  break;
      case 'lh-2':    setLineHeight('2');    break;

      case 'zoom-in':    setZoom(currentZoom + 10); break;
      case 'zoom-out':   setZoom(currentZoom - 10); break;
      case 'zoom-reset': setZoom(100); break;

      case 'toggle-spellcheck':
        toggleSpellcheck();
        break;

      case 'show-shortcuts':
        openModal('#shortcutsModal');
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
  // Safe link protocols accepted by the link dialog.
  const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'ftp:', 'mailto:', 'tel:']);

  function setupLinkModal() {
    $('#linkInsert').addEventListener('click', () => {
      const text = $('#linkText').value.trim();
      let url = $('#linkUrl').value.trim();
      if (!url) return;

      // Fragment / same-page anchor is allowed as-is.
      if (!url.startsWith('#')) {
        // If there's no scheme at all, prepend https:// so "example.com" works.
        if (!/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('/')) {
          url = 'https://' + url;
        }

        // Validate via the URL API — CodeQL recognizes this sanitizer pattern.
        let parsed;
        try {
          parsed = new URL(url, window.location.href);
        } catch (err) {
          alert('Geçersiz URL.');
          return;
        }
        if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) {
          alert('Bu URL şeması güvenlik nedeniyle kabul edilmiyor.');
          return;
        }
        url = parsed.href;
      }

      focusEditor();
      restoreSelection();
      const sel = window.getSelection();
      if (sel && sel.toString()) {
        // Wrap existing selection
        exec('createLink', url);
      } else {
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.textContent = text || url;
        if (['http:', 'https:'].includes((new URL(url, window.location.href)).protocol)) {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        }
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
          if (all) {
            // Global regex: count each match.
            node.nodeValue = node.nodeValue.replace(re, () => { replaced++; return repl; });
          } else {
            // Non-global regex: replace at most once.
            node.nodeValue = node.nodeValue.replace(re, repl);
            replaced = 1;
            break;
          }
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

  // ----- Zoom -----
  let currentZoom = 100;
  function setZoom(pct) {
    currentZoom = Math.max(50, Math.min(250, Math.round(pct)));
    editor.style.transform = `scale(${currentZoom / 100})`;
    const z = $('#zoomLevel');
    if (z) z.textContent = currentZoom + '%';
    try { localStorage.setItem('voltguard-editor-zoom', String(currentZoom)); } catch (e) {}
  }
  function loadZoom() {
    try {
      const s = parseInt(localStorage.getItem('voltguard-editor-zoom'), 10);
      if (!isNaN(s)) setZoom(s);
      else setZoom(100);
    } catch (e) { setZoom(100); }
  }

  // ----- Spell check toggle -----
  function toggleSpellcheck() {
    const cur = editor.getAttribute('spellcheck') !== 'false';
    editor.setAttribute('spellcheck', cur ? 'false' : 'true');
    setSaveStatus(cur ? 'Yazım denetimi kapalı' : 'Yazım denetimi açık', '');
  }

  // ----- Case transforms -----
  function transformCase(mode) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed || !editor.contains(sel.anchorNode)) {
      // Try to recover from saved selection (menu click may have moved focus).
      if (!restoreSelection() || window.getSelection().isCollapsed) {
        alert('Lütfen önce dönüştürülecek metni seçin.');
        return;
      }
    }
    const sel2 = window.getSelection();
    const text = sel2.toString();
    if (!text) { alert('Lütfen önce dönüştürülecek metni seçin.'); return; }
    let out;
    switch (mode) {
      case 'upper': out = text.toLocaleUpperCase(); break;
      case 'lower': out = text.toLocaleLowerCase(); break;
      case 'title':
        out = text.toLocaleLowerCase().replace(/(^|\s|['"(\[{])(\p{L})/gu, (_, p, c) => p + c.toLocaleUpperCase());
        break;
      case 'sentence':
        out = text.toLocaleLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (_, p, c) => p + c.toLocaleUpperCase());
        break;
      default: return;
    }
    // Use execCommand insertText to preserve undo history.
    document.execCommand('insertText', false, out);
    scheduleAutosave();
    updateCounts();
  }

  // ----- Line height -----
  function setLineHeight(lh) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !editor.contains(sel.anchorNode)) {
      if (!restoreSelection()) return;
    }
    const sel2 = window.getSelection();
    if (!sel2.rangeCount || !editor.contains(sel2.anchorNode)) return;

    // Find block-level ancestors inside the editor covering the selection.
    const BLOCK_RE = /^(p|div|h[1-6]|li|blockquote|pre|td|th)$/i;
    const blocks = new Set();
    function blockOf(node) {
      let n = node;
      while (n && n !== editor) {
        if (n.nodeType === 1 && BLOCK_RE.test(n.tagName)) return n;
        n = n.parentNode;
      }
      return null;
    }
    const range = sel2.getRangeAt(0);
    if (range.collapsed) {
      const b = blockOf(range.startContainer);
      if (b) blocks.add(b);
    } else {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_ELEMENT, {
        acceptNode(n) { return BLOCK_RE.test(n.tagName) && range.intersectsNode(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP; }
      });
      while (walker.nextNode()) blocks.add(walker.currentNode);
      // Also include the starting block in case no descendant matched.
      const b = blockOf(range.startContainer);
      if (b) blocks.add(b);
    }
    blocks.forEach(b => { b.style.lineHeight = lh; });
    scheduleAutosave();
  }

  // ----- Insert date / time -----
  function insertDateTime(kind) {
    const now = new Date();
    let str;
    if (kind === 'date') {
      str = now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      str = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    focusEditor();
    document.execCommand('insertText', false, str);
    scheduleAutosave();
    updateCounts();
  }

  // ----- Insert page break -----
  function insertPageBreak() {
    focusEditor();
    restoreSelection();
    const hr = document.createElement('div');
    hr.className = 'page-break';
    hr.setAttribute('contenteditable', 'false');
    insertNodeAtCaret(hr);
    // Add an empty paragraph after so the cursor can continue typing.
    const p = document.createElement('p');
    p.innerHTML = '<br>';
    hr.parentNode.insertBefore(p, hr.nextSibling);
  }

  // ----- Word stats -----
  function openWordStats() {
    const raw = (editor.innerText && editor.innerText.length ? editor.innerText : editor.textContent) || '';
    const text = raw.replace(/\u00a0/g, ' ');
    const trimmed = text.trim();
    const words = trimmed.length ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    // Split on sentence-ending punctuation; ignore trailing empty segments.
    const sentences = trimmed.length ? trimmed.split(/[.!?…]+(?:\s|$)/).filter(s => s.trim().length).length : 0;
    // Paragraphs = non-empty <p>/<h*>/<li> blocks.
    const paragraphs = Array.from(editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, blockquote, pre'))
      .filter(n => (n.textContent || '').trim().length).length;
    const readingMinutes = Math.max(1, Math.round(words / 200));

    $('#statWords').textContent = words.toLocaleString();
    $('#statChars').textContent = chars.toLocaleString();
    $('#statCharsNoSpace').textContent = charsNoSpace.toLocaleString();
    $('#statSentences').textContent = sentences.toLocaleString();
    $('#statParagraphs').textContent = paragraphs.toLocaleString();
    $('#statReading').textContent = readingMinutes + ' dk';
    openModal('#statsModal');
  }

  // ----- Symbol / emoji pickers -----
  const SYMBOLS = {
    'Yazım': ['©','®','™','§','¶','†','‡','•','…','–','—','«','»','“','”','‘','’','¿','¡','°','№'],
    'Para Birimi': ['₺','$','€','£','¥','¢','₽','₹','₩','₴','₦','₫','₱','฿','₪','₡'],
    'Matematik': ['±','×','÷','√','∞','≈','≠','≤','≥','∑','∏','∆','∂','∫','π','Ω','µ','‰','∈','∉','⊂','⊃','∪','∩'],
    'Oklar': ['←','→','↑','↓','↔','↕','⇐','⇒','⇑','⇓','⇔','↩','↪','↺','↻','↯'],
    'Şekiller': ['■','□','▲','△','▼','▽','●','○','◆','◇','★','☆','♠','♣','♥','♦','✓','✔','✗','✘'],
    'Yunan': ['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','π','ρ','σ','τ','υ','φ','χ','ψ','ω','Α','Β','Γ','Δ','Σ','Ω'],
  };
  const EMOJI = {
    'Gülen': ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔'],
    'Jestler': ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤝','🙏','✍️','💪','👏'],
    'Kalp': ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝'],
    'Nesne': ['📄','📃','📑','📊','📈','📉','📋','📌','📍','📎','🖇️','📏','📐','✂️','🖊️','🖋️','✒️','🖌️','🖍️','📝','💼','🗂️','🗃️','🗄️','🗑️','🔒','🔓','🔑','🔐','📧','📮','📬'],
    'İşaret': ['✅','❌','⚠️','‼️','⁉️','❓','❔','❕','❗','〰️','©️','®️','™️','🆗','🆕','🆙','🆒','🔥','⭐','🌟','✨','💡','⏰','📅','📆'],
    'Gıda': ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌽','🥕','🫑','🌶️','🍞','🧀','🍕','🍔','🍟','🌮','☕','🍵','🍺','🍷'],
    'Hayvan': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐺','🐴','🦓','🦄','🐝','🐞','🦋','🐌','🐢','🐍','🦖','🦀','🐟','🐬','🐳','🦈'],
    'Seyahat': ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛵','🏍️','🚲','🛴','✈️','🚀','🛸','🚁','⛵','🚤','🛳️','🚢','🚆','🚇','🚊','🏠','🏢','🗽','🗼','🏰'],
  };

  function setupPickerModal(modalSel, tabsSel, gridSel, dataset) {
    const tabsEl = $(tabsSel);
    const gridEl = $(gridSel);
    const names = Object.keys(dataset);
    let activeTab = names[0];

    function renderTabs() {
      tabsEl.innerHTML = '';
      names.forEach(name => {
        const t = document.createElement('button');
        t.type = 'button';
        t.className = 'picker-tab' + (name === activeTab ? ' active' : '');
        t.textContent = name;
        t.setAttribute('role', 'tab');
        t.addEventListener('click', () => { activeTab = name; renderTabs(); renderGrid(); });
        tabsEl.appendChild(t);
      });
    }
    function renderGrid() {
      gridEl.innerHTML = '';
      dataset[activeTab].forEach(ch => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = ch;
        b.title = ch;
        b.setAttribute('role', 'option');
        b.addEventListener('click', () => {
          focusEditor();
          restoreSelection();
          document.execCommand('insertText', false, ch);
          scheduleAutosave();
          updateCounts();
          closeModal($(modalSel));
        });
        gridEl.appendChild(b);
      });
    }
    renderTabs();
    renderGrid();
  }

  // ----- PDF export via clean print iframe -----
  // Page size in millimeters for CSS @page.
  const PDF_PAGE_SIZES = {
    'A3':     { w: 297, h: 420 },
    'A4':     { w: 210, h: 297 },
    'A5':     { w: 148, h: 210 },
    'Letter': { w: 216, h: 279 },
    'Legal':  { w: 216, h: 356 },
  };

  function setupPdfExport() {
    $('#pdfExportStart').addEventListener('click', () => {
      const size = $('#pdfPageSize').value;
      const orientation = $('#pdfOrientation').value;
      const margin = Math.max(0, Math.min(10, parseFloat($('#pdfMargin').value) || 2));

      const dims = PDF_PAGE_SIZES[size] || PDF_PAGE_SIZES.A4;
      const pageCss = orientation === 'landscape'
        ? `${dims.h}mm ${dims.w}mm`
        : `${dims.w}mm ${dims.h}mm`;

      // Build an isolated iframe with the clean document so the user's browser
      // can "Save as PDF" from its print dialog (supported in all modern browsers).
      const iframe = document.createElement('iframe');
      iframe.setAttribute('aria-hidden', 'true');
      iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
      iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument;
      // Assemble the exported body from sanitized editor HTML.
      const cleanBody = sanitizeHtml(editor.innerHTML);

      doc.open();
      doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Belge</title></head><body></body></html>');
      doc.close();

      // Inject stylesheet via textContent (no HTML string -> innerHTML paths for user data).
      const style = doc.createElement('style');
      style.textContent = `
        @page { size: ${pageCss}; margin: ${margin}cm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; color: #1e2330; }
        body { font-family: Georgia, "Times New Roman", serif; font-size: 12pt; line-height: 1.55; }
        h1, h2, h3, h4, h5, h6 { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; margin: 1em 0 .4em; break-after: avoid; page-break-after: avoid; }
        h1 { font-size: 22pt; } h2 { font-size: 18pt; } h3 { font-size: 15pt; } h4 { font-size: 13pt; }
        p { margin: 0 0 .7em; orphans: 2; widows: 2; }
        blockquote { border-left: 3px solid #2a5dff; margin: 0 0 1em; padding: .2em 1em; background: #f5f7ff; }
        pre { background: #f1f3f7; border: 1px solid #e1e4ec; padding: 10px 12px; border-radius: 4px; overflow: hidden; white-space: pre-wrap; font-family: "Courier New", monospace; font-size: 10.5pt; }
        ul, ol { margin: 0 0 .7em; padding-left: 1.5em; }
        table { border-collapse: collapse; width: 100%; margin: .5em 0; break-inside: auto; }
        tr { break-inside: avoid; page-break-inside: avoid; }
        th, td { border: 1px solid #c9cfdc; padding: 6px 8px; vertical-align: top; }
        th { background: #eef1f8; text-align: left; }
        img { max-width: 100%; height: auto; }
        hr { border: 0; border-top: 1px solid #d0d6e2; margin: 1.2em 0; }
        a { color: #1e49d6; text-decoration: underline; }
        .signature { display: inline-block; margin: 6px 0; max-width: 360px; }
        .signature img { max-width: 100%; height: auto; display: block; }
        .page-break { break-after: page; page-break-after: always; display: block; height: 0; }
      `;
      doc.head.appendChild(style);

      // Build the body using DOMParser to avoid any innerHTML assignment with user content.
      const parsed = new DOMParser().parseFromString(
        '<!doctype html><html><body>' + cleanBody + '</body></html>',
        'text/html'
      );
      Array.from(parsed.body.childNodes).forEach(n => {
        doc.body.appendChild(doc.importNode(n, true));
      });

      closeModal($('#pdfModal'));

      // Give the iframe layout a beat before calling print.
      const triggerPrint = () => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (err) {
          console.warn('Iframe print failed, falling back', err);
          window.print();
        }
        // Clean up after the print dialog is closed.
        const cleanup = () => {
          setTimeout(() => {
            if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
          }, 300);
        };
        if (iframe.contentWindow && iframe.contentWindow.addEventListener) {
          iframe.contentWindow.addEventListener('afterprint', cleanup, { once: true });
        }
        // Safety fallback: remove after 5 minutes regardless.
        setTimeout(cleanup, 5 * 60 * 1000);
      };

      // Wait for images inside the iframe to load so they render in the PDF.
      const imgs = Array.from(doc.images || []);
      if (imgs.length === 0) {
        setTimeout(triggerPrint, 50);
      } else {
        let pending = imgs.length;
        const done = () => { if (--pending <= 0) setTimeout(triggerPrint, 30); };
        imgs.forEach(img => {
          if (img.complete) done();
          else { img.addEventListener('load', done); img.addEventListener('error', done); }
        });
        // Hard timeout in case something hangs.
        setTimeout(triggerPrint, 3000);
      }
    });
  }

  // ----- HTML -> Markdown (best-effort) -----
  function htmlToMarkdown(root) {
    const out = [];
    function esc(s) { return String(s).replace(/([\\`*_{}\[\]()#+\-!|>])/g, '\\$1'); }
    function inline(node) {
      let s = '';
      node.childNodes.forEach(c => {
        if (c.nodeType === 3) { s += esc(c.nodeValue); return; }
        if (c.nodeType !== 1) return;
        const tag = c.tagName.toLowerCase();
        const inner = inline(c);
        switch (tag) {
          case 'b': case 'strong': s += `**${inner}**`; break;
          case 'i': case 'em':     s += `*${inner}*`; break;
          case 'u':                s += `<u>${inner}</u>`; break;
          case 's': case 'strike': case 'del': s += `~~${inner}~~`; break;
          case 'code':             s += '`' + c.textContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`'; break;
          case 'a': {
            const href = c.getAttribute('href') || '';
            s += `[${inner}](${href})`;
            break;
          }
          case 'img': {
            const src = c.getAttribute('src') || '';
            const alt = c.getAttribute('alt') || '';
            s += `![${alt}](${src})`;
            break;
          }
          case 'br': s += '  \n'; break;
          default: s += inner;
        }
      });
      return s;
    }
    function block(node, depth, listCtx) {
      node.childNodes.forEach(c => {
        if (c.nodeType === 3) {
          const t = c.nodeValue.trim();
          if (t) out.push(esc(t), '\n\n');
          return;
        }
        if (c.nodeType !== 1) return;
        const tag = c.tagName.toLowerCase();
        const m = tag.match(/^h([1-6])$/);
        if (m) { out.push('#'.repeat(parseInt(m[1], 10)) + ' ' + inline(c).trim(), '\n\n'); return; }
        if (tag === 'p') { const t = inline(c).trim(); if (t) out.push(t, '\n\n'); return; }
        if (tag === 'blockquote') { const t = inline(c).trim(); out.push(t.split('\n').map(l => '> ' + l).join('\n'), '\n\n'); return; }
        if (tag === 'pre') { out.push('```\n' + c.textContent + '\n```\n\n'); return; }
        if (tag === 'hr' || (tag === 'div' && c.classList.contains('page-break'))) { out.push('\n---\n\n'); return; }
        if (tag === 'ul' || tag === 'ol') {
          let i = 1;
          Array.from(c.children).forEach(li => {
            if (li.tagName.toLowerCase() !== 'li') return;
            const prefix = tag === 'ol' ? `${i++}. ` : '- ';
            const indent = '  '.repeat(depth);
            out.push(indent + prefix + inline(li).trim(), '\n');
            // Nested lists
            Array.from(li.children).forEach(ch => {
              if (/^(ul|ol)$/i.test(ch.tagName)) block(li, depth + 1);
            });
          });
          out.push('\n');
          return;
        }
        if (tag === 'table') {
          const rows = Array.from(c.querySelectorAll('tr'));
          if (!rows.length) return;
          const firstCells = Array.from(rows[0].children);
          const hasHeader = firstCells.some(td => td.tagName.toLowerCase() === 'th');
          const cellText = td => inline(td).replace(/\|/g, '\\|').trim();
          const header = firstCells.map(cellText);
          out.push('| ' + header.join(' | ') + ' |\n');
          out.push('| ' + header.map(() => '---').join(' | ') + ' |\n');
          rows.slice(hasHeader ? 1 : 0).forEach(tr => {
            out.push('| ' + Array.from(tr.children).map(cellText).join(' | ') + ' |\n');
          });
          out.push('\n');
          return;
        }
        // Generic container: recurse.
        block(c, depth);
      });
    }
    block(root, 0);
    return out.join('').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }


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
    // data:image/... only when explicitly allowed (for <img>).
    // Note: svg+xml is intentionally excluded because SVG can contain scripts.
    // Valid data URLs may use either ';' (with params like base64) or ',' (direct).
    if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|bmp)[;,]/i.test(v)) return true;
    return false;
  }

  function sanitizeHtml(html) {
    // Parse inertly via DOMParser; the resulting document executes no scripts
    // and performs no network activity.
    const parsed = new DOMParser().parseFromString(
      '<!doctype html><html><body>' + String(html) + '</body></html>',
      'text/html'
    );
    const root = parsed.body;

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
          // target=_blank must have rel including noopener + noreferrer.
          if (tag === 'a' && name === 'target' && /_blank/i.test(val)) {
            const existing = (child.getAttribute('rel') || '')
              .split(/\s+/).filter(Boolean);
            const needed = ['noopener', 'noreferrer'];
            for (const n of needed) if (!existing.some(e => e.toLowerCase() === n)) existing.push(n);
            child.setAttribute('rel', existing.join(' '));
          }
        }

        walk(child);
      }
    };
    walk(root);
    return root.innerHTML;
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
      if (e.shiftKey && k === 'p') {
        e.preventDefault(); handleCommand('file-export-pdf'); return;
      }
      // Zoom: Ctrl++ / Ctrl+- / Ctrl+0  (supports keyboards where + is Shift+=)
      if (k === '=' || k === '+') { e.preventDefault(); handleCommand('zoom-in'); return; }
      if (k === '-') { e.preventDefault(); handleCommand('zoom-out'); return; }
      if (k === '0') { e.preventDefault(); handleCommand('zoom-reset'); return; }

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
    setupPdfExport();
    setupPickerModal('#symbolModal', '#symbolTabs', '#symbolGrid', SYMBOLS);
    setupPickerModal('#emojiModal',  '#emojiTabs',  '#emojiGrid',  EMOJI);
    setupPasteHandler();
    setupShortcuts();
    loadZoom();

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
