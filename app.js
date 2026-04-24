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
  const LETTERHEAD_HTML = [
    '<div style="display:flex;align-items:center;gap:16px;padding-bottom:14px;margin-bottom:20px;border-bottom:2px solid #0b2447;">',
      '<img src="logo.png" alt="VoltGuard" style="height:64px;width:auto;flex-shrink:0;border-radius:8px;" />',
      '<div style="flex:1;text-align:center;">',
        '<strong style="font-size:13px;color:#0b2447;text-transform:uppercase;letter-spacing:.4px;display:block;line-height:1.5;">VoltGuard Elektrik Elektronik ve Mekanik M\u00fchendisli\u011fi Limited \u015eirketi</strong>',
        '<span style="font-size:12px;color:#555;display:block;margin-top:4px;">Adalet Mah. Manas Bul. Folkart Towers No: 39 \u0130\u00e7 Kap\u0131 No: 2511 Bayrakl\u0131 / \u0130zmir</span>',
        '<span style="font-size:12px;color:#555;display:block;margin-top:2px;">Kar\u015f\u0131yaka VD \u00b7 Vkn: 9251324900</span>',
      '</div>',
    '</div>',
    '<h1>VoltGuard Kimdir?</h1>',
    '<p>VoltGuard; end\u00fcstriyel tesisler, fabrikalar, \u00fcretim hatlar\u0131, ticari i\u015fletmeler ve teknik altyap\u0131ya ihtiya\u00e7 duyan yap\u0131lar i\u00e7in elektrik, otomasyon, elektronik ve mekanik m\u00fchendislik \u00e7\u00f6z\u00fcmleri sunan bir m\u00fchendislik ve teknik hizmet markas\u0131d\u0131r.</p>',
    '<p>Elektrik tesisati, pano sistemleri, trafo i\u015fletme sorumlulu\u011fu, SMM hizmetleri, end\u00fcstriyel otomasyon, PLC-SCADA \u00e7\u00f6z\u00fcmleri, g\u00f6m\u00fcl\u00fc sistemler, mekanik sistem kurulumu, makine modernizasyonu ve periyodik kontrol hizmetleriyle i\u015fletmelerin teknik ihtiya\u00e7lar\u0131na u\u00e7tan uca \u00e7\u00f6z\u00fcm sunar.</p>',
    '<p>VoltGuard, yaln\u0131zca ar\u0131za gideren veya saha uygulamas\u0131 yapan bir yap\u0131 de\u011fil; ke\u015fif, projelendirme, malzeme temini, uygulama, \u00f6l\u00e7\u00fcm, raporlama, devreye alma ve bak\u0131m s\u00fcre\u00e7lerini birlikte ele alan b\u00fct\u00fcnc\u00fcl bir m\u00fchendislik \u00e7\u00f6z\u00fcm orta\u011f\u0131d\u0131r.</p>',
    '<h2>Ne Yapar?</h2>',
    '<p>VoltGuard; i\u015fletmelerin elektrik, otomasyon, elektronik ve mekanik altyap\u0131lar\u0131n\u0131 daha g\u00fcvenli, verimli, s\u00fcrd\u00fcr\u00fclebilir ve mevzuata uygun hale getirmek i\u00e7in \u00e7al\u0131\u015f\u0131r.</p>',
    '<p><strong>Ba\u015fl\u0131ca hizmet alanlar\u0131:</strong></p>',
    '<ul>',
      '<li>Elektrik m\u00fchendisli\u011fi ve saha uygulamalar\u0131</li>',
      '<li>SMM ve trafo i\u015fletme sorumlulu\u011fu hizmetleri</li>',
      '<li>Elektrik pano kurulumu, revizyonu ve bak\u0131m \u00e7al\u0131\u015fmalar\u0131</li>',
      '<li>Periyodik kontrol, \u00f6l\u00e7\u00fcm ve raporlama hizmetleri</li>',
      '<li>PLC yaz\u0131l\u0131m geli\u015ftirme ve SCADA sistemleri</li>',
      '<li>End\u00fcstriyel otomasyon projelendirme</li>',
      '<li>Makine otomasyonu ve proses kontrol\u00fc</li>',
      '<li>G\u00f6m\u00fcl\u00fc sistemler, IoT ve elektronik kart tasar\u0131m\u0131</li>',
      '<li>Mekanik sistem kurulumu, revizyonu ve modernizasyonu</li>',
      '<li>Hidrolik, pn\u00f6matik, konvey\u00f6r, pompa, fan ve motor sistemleri</li>',
      '<li>Mekanik SMM ve mekanik periyodik kontrol hizmetleri</li>',
    '</ul>',
    '<h2>VoltGuard&#39;\u0131n Yakla\u015f\u0131m\u0131</h2>',
    '<p>VoltGuard, her projeyi yaln\u0131zca teknik bir uygulama olarak de\u011fil, i\u015fletmenin \u00fcretim s\u00fcreklilikini, g\u00fcvenli\u011fini ve verimlili\u011fini etkileyen b\u00fct\u00fcnsel bir s\u00fcre\u00e7 olarak ele al\u0131r.</p>',
    '<ol>',
      '<li>\u00d6nce ihtiya\u00e7 ve saha ko\u015fullar\u0131 analiz edilir.</li>',
      '<li>Uygun teknik \u00e7\u00f6z\u00fcm ve malzeme belirlenir.</li>',
      '<li>Projelendirme, uygulama ve montaj s\u00fcre\u00e7leri planlan\u0131r.</li>',
      '<li>Sistemler test edilir, devreye al\u0131n\u0131r ve raporlan\u0131r.</li>',
      '<li>Gerekti\u011finde bak\u0131m, revizyon ve teknik destek sa\u011flan\u0131r.</li>',
    '</ol>',
    '<p><br></p>',
  ].join('');
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
        // Sanitize before assigning to prevent stored-XSS from a tampered localStorage entry.
        editor.innerHTML = sanitizeHtml(saved);
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
          editor.innerHTML = LETTERHEAD_HTML;
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
      // Boyut seçiciyi sıfırlama; mevcut seçim görünsün.
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
  // Which tab is active in the signature modal ('draw' | 'type' | 'upload').
  let signatureMode = 'draw';
  // Last valid image dataURL chosen via the Upload tab.
  let signatureUploadDataUrl = null;

  // Signature fonts offered in the Type tab.
  // We stick to widely-available system fonts (incl. cursive fallbacks) so no
  // external network requests / CDNs are needed.
  const SIGNATURE_FONTS = [
    { label: 'Cursive',  css: '"Segoe Script", "Lucida Handwriting", "Apple Chancery", cursive' },
    { label: 'Script',   css: '"Brush Script MT", "Brush Script Std", cursive' },
    { label: 'Formal',   css: '"Monotype Corsiva", "Apple Chancery", "URW Chancery L", cursive' },
    { label: 'Italic',   css: 'italic 1em Georgia, "Times New Roman", serif' },
    { label: 'Classic',  css: 'bold italic 1em "Times New Roman", Times, serif' },
    { label: 'Modern',   css: '500 1em "Segoe UI", "Helvetica Neue", sans-serif' },
  ];

  function setupSignatureModal() {
    const canvas = $('#signatureCanvas');
    const ctx = canvas.getContext('2d');
    const transparentChk = $('#sigTransparent');
    const colorInput = $('#sigColor');
    const widthInput = $('#sigWidth');

    // Offscreen ink-only buffer: we mirror every stroke here on a transparent
    // background so we can rebuild the visible canvas losslessly when the
    // user toggles "transparent background".
    let inkLayer = null;
    let inkCtx = null;

    // Stroke history on the ink layer for undo.
    const strokeHistory = [];
    let drawing = false;
    let activePointerId = null;
    let hasInk = false;
    let lastX = 0, lastY = 0;
    let midX = 0, midY = 0;

    function ensureInkLayer() {
      if (!inkLayer || inkLayer.width !== canvas.width || inkLayer.height !== canvas.height) {
        inkLayer = document.createElement('canvas');
        inkLayer.width = canvas.width;
        inkLayer.height = canvas.height;
        inkCtx = inkLayer.getContext('2d');
        const ratio = window.devicePixelRatio || 1;
        inkCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
        inkCtx.lineCap = 'round';
        inkCtx.lineJoin = 'round';
      }
    }

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      canvas.width = w * ratio;
      canvas.height = h * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      // New dimensions invalidate the ink layer + history.
      inkLayer = null; inkCtx = null;
      strokeHistory.length = 0;
      hasInk = false;
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

    // Repaint the visible canvas = current background + ink layer composited on top.
    function repaint() {
      redrawBackground();
      if (inkLayer) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(inkLayer, 0, 0);
        ctx.restore();
      }
    }

    function clearSignature() {
      hasInk = false;
      strokeHistory.length = 0;
      inkLayer = null; inkCtx = null;
      redrawBackground();
    }

    function undoStroke() {
      if (!strokeHistory.length || !inkCtx) return;
      strokeHistory.pop();
      // Reset ink layer and replay remaining snapshots.
      inkCtx.clearRect(0, 0, inkLayer.width, inkLayer.height);
      if (strokeHistory.length) {
        inkCtx.save();
        inkCtx.setTransform(1, 0, 0, 1, 0, 0);
        inkCtx.putImageData(strokeHistory[strokeHistory.length - 1], 0, 0);
        inkCtx.restore();
        hasInk = true;
      } else {
        hasInk = false;
      }
      repaint();
    }

    function pointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (typeof e.clientX === 'number' && !Number.isNaN(e.clientX)) {
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
      if (e.touches && e.touches[0]) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: 0, y: 0 };
    }

    function applyStrokeStyle(c) {
      c.strokeStyle = colorInput.value;
      c.fillStyle = colorInput.value;
      c.lineWidth = parseFloat(widthInput.value) || 2.5;
    }

    function startDraw(e) {
      ensureInkLayer();
      if (e.cancelable !== false && e.preventDefault) e.preventDefault();
      if (typeof e.pointerId === 'number') {
        activePointerId = e.pointerId;
        if (canvas.setPointerCapture) {
          try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }
      drawing = true;
      const p = pointerPos(e);
      lastX = midX = p.x;
      lastY = midY = p.y;
      applyStrokeStyle(ctx);
      applyStrokeStyle(inkCtx);
      // Dot so a single tap leaves a mark — on both layers.
      ctx.beginPath();
      ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      inkCtx.beginPath();
      inkCtx.arc(p.x, p.y, inkCtx.lineWidth / 2, 0, Math.PI * 2);
      inkCtx.fill();
      hasInk = true;
    }
    function moveDraw(e) {
      if (!drawing) return;
      if (typeof e.pointerId === 'number' && activePointerId !== null && e.pointerId !== activePointerId) return;
      if (e.cancelable !== false && e.preventDefault) e.preventDefault();
      const p = pointerPos(e);
      applyStrokeStyle(ctx);
      applyStrokeStyle(inkCtx);
      // Quadratic smoothing: draw through the previous midpoint using the
      // previous raw point as control, landing on the new midpoint.
      const newMidX = (lastX + p.x) / 2;
      const newMidY = (lastY + p.y) / 2;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.quadraticCurveTo(lastX, lastY, newMidX, newMidY);
      ctx.stroke();
      inkCtx.beginPath();
      inkCtx.moveTo(midX, midY);
      inkCtx.quadraticCurveTo(lastX, lastY, newMidX, newMidY);
      inkCtx.stroke();
      lastX = p.x; lastY = p.y;
      midX = newMidX; midY = newMidY;
      hasInk = true;
    }
    function endDraw(e) {
      if (!drawing) return;
      drawing = false;
      if (typeof e?.pointerId === 'number' && canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
      }
      activePointerId = null;
      // Snapshot the ink layer so undo can rewind to this state.
      try {
        if (inkCtx) {
          strokeHistory.push(inkCtx.getImageData(0, 0, inkLayer.width, inkLayer.height));
          if (strokeHistory.length > 50) strokeHistory.shift();
        }
      } catch (_) { /* getImageData may fail in headless test environments */ }
    }

    // Prefer Pointer Events (mouse + pen + touch in one API); fall back to
    // the classic mouse/touch pair for older browsers.
    if (window.PointerEvent) {
      canvas.addEventListener('pointerdown', startDraw);
      canvas.addEventListener('pointermove', moveDraw);
      canvas.addEventListener('pointerup', endDraw);
      canvas.addEventListener('pointercancel', endDraw);
      canvas.addEventListener('pointerleave', endDraw);
    } else {
      canvas.addEventListener('mousedown', startDraw);
      canvas.addEventListener('mousemove', moveDraw);
      window.addEventListener('mouseup', endDraw);
      canvas.addEventListener('touchstart', startDraw, { passive: false });
      canvas.addEventListener('touchmove', moveDraw, { passive: false });
      canvas.addEventListener('touchend', endDraw);
      canvas.addEventListener('touchcancel', endDraw);
    }

    transparentChk.addEventListener('change', repaint);

    $('#sigClear').addEventListener('click', clearSignature);
    $('#sigUndo').addEventListener('click', undoStroke);

    // ---------- Type tab ----------
    const typeText = $('#sigTypeText');
    const typeColor = $('#sigTypeColor');
    const typeSize = $('#sigTypeSize');
    const fontList = $('#sigFontList');
    let chosenFontIdx = 0;

    function fontSampleSize() { return 32; }

    function renderFontList() {
      fontList.innerHTML = '';
      const sample = (typeText.value || '').trim() || 'Örnek İmza';
      SIGNATURE_FONTS.forEach((f, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = sample;
        b.title = f.label;
        b.style.font = `${fontSampleSize()}px ${stripFontSize(f.css)}`;
        if (i === chosenFontIdx) b.classList.add('active');
        b.addEventListener('click', () => {
          chosenFontIdx = i;
          renderFontList();
        });
        fontList.appendChild(b);
      });
    }
    function stripFontSize(css) {
      // Remove any explicit em/px size from the font shorthand so we can apply our own.
      return css.replace(/\b\d+(?:\.\d+)?(?:em|px)\s+/g, '');
    }
    typeText.addEventListener('input', renderFontList);

    // ---------- Upload tab ----------
    const uploadInput = $('#sigUploadInput');
    const uploadPreview = $('#sigUploadPreview');
    const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

    uploadInput.addEventListener('change', () => {
      signatureUploadDataUrl = null;
      uploadPreview.innerHTML = '';
      const f = uploadInput.files && uploadInput.files[0];
      if (!f) {
        const ph = document.createElement('span');
        ph.className = 'placeholder';
        ph.textContent = 'Henüz görüntü seçilmedi.';
        uploadPreview.appendChild(ph);
        return;
      }
      if (!/^image\/(png|jpeg|gif|webp)$/i.test(f.type)) {
        alert('Lütfen PNG, JPG, GIF veya WEBP formatında bir görüntü seçin.');
        uploadInput.value = '';
        return;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        alert('Görüntü çok büyük (en fazla 5 MB).');
        uploadInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        // Defense in depth: sanitizer already enforces this, but validate early
        // so the user sees feedback immediately.
        if (!/^data:image\/(png|jpeg|gif|webp);/i.test(url)) {
          alert('Görüntü okunamadı.');
          return;
        }
        const img = new Image();
        img.alt = 'Yüklenen imza önizlemesi';
        img.onload = () => {
          signatureUploadDataUrl = url;
          uploadPreview.innerHTML = '';
          uploadPreview.appendChild(img);
        };
        img.onerror = () => {
          signatureUploadDataUrl = null;
          alert('Görüntü yüklenemedi.');
        };
        img.src = url;
      };
      reader.onerror = () => alert('Dosya okunamadı.');
      reader.readAsDataURL(f);
    });

    // ---------- Tab switching ----------
    $$('.sig-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        signatureMode = tab.dataset.sigTab;
        $$('.sig-tab').forEach(t => {
          const on = t === tab;
          t.classList.toggle('active', on);
          t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        $$('.sig-panel').forEach(p => {
          p.classList.toggle('active', p.dataset.sigPanel === signatureMode);
        });
        if (signatureMode === 'draw') {
          // Canvas has no layout while the panel is hidden; resize now that it is visible.
          requestAnimationFrame(() => signatureResize && signatureResize());
        } else if (signatureMode === 'type') {
          renderFontList();
        }
      });
    });

    // ---------- Insert into document ----------
    function renderTypedSignature() {
      const text = (typeText.value || '').trim();
      if (!text) return null;
      const size = parseInt(typeSize.value, 10) || 44;
      const color = typeColor.value;
      const font = SIGNATURE_FONTS[chosenFontIdx] || SIGNATURE_FONTS[0];
      const fontStr = `${size}px ${stripFontSize(font.css)}`;

      const pad = Math.round(size * 0.3);
      const meas = document.createElement('canvas');
      const mctx = meas.getContext('2d');
      mctx.font = fontStr;
      const width = Math.max(1, Math.ceil(mctx.measureText(text).width));
      const height = Math.ceil(size * 1.6);
      const out = document.createElement('canvas');
      out.width = width + pad * 2;
      out.height = height + pad;
      const octx = out.getContext('2d');
      octx.font = fontStr;
      octx.fillStyle = color;
      octx.textBaseline = 'middle';
      octx.fillText(text, pad, out.height / 2);
      return out.toDataURL('image/png');
    }

    $('#sigInsert').addEventListener('click', () => {
      let dataUrl = null;
      let altText = 'İmza';
      if (signatureMode === 'draw') {
        if (!hasInk) { alert('Lütfen önce imzanızı çizin.'); return; }
        dataUrl = canvas.toDataURL('image/png');
      } else if (signatureMode === 'type') {
        dataUrl = renderTypedSignature();
        if (!dataUrl) { alert('Lütfen imzanızı yazın.'); return; }
        altText = 'İmza: ' + typeText.value.trim();
      } else if (signatureMode === 'upload') {
        if (!signatureUploadDataUrl) { alert('Lütfen önce bir görüntü seçin.'); return; }
        dataUrl = signatureUploadDataUrl;
        altText = 'İmza (yüklenen görüntü)';
      }
      if (!dataUrl) return;

      const wrap = document.createElement('span');
      wrap.className = 'signature';
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = altText;
      wrap.appendChild(img);

      focusEditor();
      restoreSelection();
      insertNodeAtCaret(wrap);
      closeModal($('#signatureModal'));
    });

    // Populate the initial font list so the Type tab is ready on first view.
    renderFontList();

    // Expose resize so openSignatureModal can call it after the modal is visible.
    signatureResize = resizeCanvas;
  }

  function openSignatureModal() {
    // Reset upload state each time the modal is opened.
    signatureUploadDataUrl = null;
    const up = $('#sigUploadInput'); if (up) up.value = '';
    const pv = $('#sigUploadPreview');
    if (pv) pv.innerHTML = '<span class="placeholder">Henüz görüntü seçilmedi.</span>';

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
        .print-hide { display: none !important; }
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
        let printFired = false;
        const done = () => {
          if (--pending <= 0 && !printFired) { printFired = true; setTimeout(triggerPrint, 30); }
        };
        imgs.forEach(img => {
          if (img.complete) done();
          else { img.addEventListener('load', done); img.addEventListener('error', done); }
        });
        // Hard timeout in case something hangs — fire once only.
        setTimeout(() => { if (!printFired) { printFired = true; triggerPrint(); } }, 3000);
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
    function block(node, depth) {
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
              if (/^(ul|ol)$/i.test(ch.tagName)) block(ch, depth + 1);
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
    // data:image/... only when explicitly allowed (for <img>).
    // Note: svg+xml is intentionally excluded because SVG can contain scripts.
    // Valid data URLs may use either ';' (with params like base64) or ',' (direct).
    if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|bmp)[;,]/i.test(v)) return true;
    // Reject all other data: URLs.
    if (/^data:/i.test(v)) return false;
    // Allow http/https/ftp.
    if (/^(https?|ftp):/i.test(v)) return true;
    // Allow mailto/tel.
    if (/^(mailto:|tel:)/i.test(v)) return true;
    // Block any remaining explicit scheme (javascript:, vbscript:, blob:, etc.)
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return false;
    // No recognised scheme → relative URL (e.g. logo.png, ./img/x.jpg, /assets/y.png), safe.
    return true;
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
    // Modal içindeki form alanlarında (input/textarea/select) kısayol çakışmasını
    // engellemek için yardımcı: kullanıcı yazı yazarken Ctrl+P/S gibi tarayıcı
    // varsayılanlarını yakalamak istesek de, yakınlaştırma (+/-/0) tuşları
    // alan içinde beklenmedik davranış yaratıyor.
    function inFormField(target) {
      if (!target || target === editor) return false;
      const tag = (target.tagName || '').toLowerCase();
      return tag === 'input' || tag === 'textarea' || tag === 'select';
    }

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
      // Form alanlarında tetikleme — kullanıcı sayı girerken +/- basabilir.
      if (!inFormField(e.target)) {
        if (k === '=' || k === '+') { e.preventDefault(); handleCommand('zoom-in'); return; }
        if (k === '-') { e.preventDefault(); handleCommand('zoom-out'); return; }
        if (k === '0') { e.preventDefault(); handleCommand('zoom-reset'); return; }
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

    // Load company logo if available; falls back gracefully to the ⚡ icon.
    (function () {
      const icon = document.getElementById('brandLogoIcon');
      if (!icon) return;
      const img = new Image();
      img.alt = 'VoltGuard';
      img.className = 'brand-logo-img';
      img.onload = function () {
        icon.textContent = '';
        icon.classList.add('has-logo');
        icon.appendChild(img);
      };
      img.onerror = function () {
        // logo.png bulunamazsa ⚡ ikonu korunur.
      };
      img.src = 'logo.png';
    }());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
