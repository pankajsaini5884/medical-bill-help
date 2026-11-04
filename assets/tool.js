/* Free letter generator UI. Everything stays in this browser tab: no fetch, no storage, no cookies. */
(function () {
  'use strict';
  var K = window.KitLetters;
  var form = document.getElementById('letterForm');
  var preview = document.getElementById('letterPreview');
  var status = document.getElementById('status');
  if (!K || !form || !preview) return;

  function currentType() {
    var r = form.querySelector('input[name="letterType"]:checked');
    return r ? r.value : 'itemized';
  }

  function readData() {
    var d = {};
    Array.prototype.forEach.call(form.querySelectorAll('[data-key]'), function (el) {
      d[el.getAttribute('data-key')] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return d;
  }

  function syncLabels(type) {
    var meta = K.LETTERS[type];
    document.getElementById('lblNumber').textContent = meta.numberLabel;
    document.getElementById('lblNoticeDate').textContent = meta.denialDateLabel;
    document.getElementById('lblReason').textContent = meta.reasonLabel;
    document.getElementById('hintReason').textContent = meta.reasonHint;
    document.getElementById('lblRecipient').textContent = meta.to;
    Array.prototype.forEach.call(document.querySelectorAll('[data-only]'), function (el) {
      el.hidden = el.getAttribute('data-only') !== type;
    });
  }

  function render() {
    var type = currentType();
    syncLabels(type);
    preview.textContent = K.buildLetter(type, readData());
  }

  function say(msg) {
    status.textContent = msg;
    clearTimeout(say.t);
    say.t = setTimeout(function () { status.textContent = ''; }, 4000);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (e) { reject(e); } finally { document.body.removeChild(ta); }
    });
  }

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  document.getElementById('btnCopy').addEventListener('click', function () {
    render();
    copyText(preview.textContent).then(function () { say('Copied to your clipboard.'); },
      function () { say('Could not copy automatically. Select the letter text and copy it by hand.'); });
  });

  document.getElementById('btnPrint').addEventListener('click', function () { render(); window.print(); });

  document.getElementById('btnDownload').addEventListener('click', function () {
    render();
    var type = currentType();
    var blob = new Blob([preview.textContent], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = K.fileName(type, readData());
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    say('Downloaded ' + a.download + ' to this device.');
  });

  document.getElementById('btnClear').addEventListener('click', function () {
    Array.prototype.forEach.call(form.querySelectorAll('[data-key]'), function (el) {
      if (el.type === 'checkbox') el.checked = false; else if (el.id !== 'fLetterDate') el.value = '';
    });
    render(); say('Form cleared.');
  });

  // Default letter date = today (local), then first render.
  var ld = document.getElementById('fLetterDate');
  if (ld && !ld.value) {
    var t = new Date();
    ld.value = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
  }
  // Allow ?letter=appeal deep links from articles.
  var m = /[?&]letter=(itemized|appeal|assistance)\b/.exec(location.search);
  if (m) { var r = form.querySelector('input[name="letterType"][value="' + m[1] + '"]'); if (r) r.checked = true; }
  render();
})();
