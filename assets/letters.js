/*
 * Letter templates for the free generator.
 * Pure functions only: no network, no storage, no DOM. Runs in the browser and in Node (for tests).
 */
(function (root) {
  'use strict';

  var LETTERS = {
    itemized: {
      id: 'itemized',
      label: 'Itemized bill request',
      to: 'Provider / hospital billing department',
      reasonLabel: 'Anything you want them to know (optional)',
      reasonHint: 'e.g. "The bill lists a charge for a test I do not remember receiving."',
      denialDateLabel: 'Date on the bill',
      numberLabel: 'Account / invoice number'
    },
    appeal: {
      id: 'appeal',
      label: 'Internal appeal of a denied claim',
      to: 'Health insurer / plan appeals department',
      reasonLabel: 'Why the denial is wrong',
      reasonHint: 'Use your own words. e.g. "My doctor ordered this MRI because my symptoms did not improve after 6 weeks of physical therapy. A letter from my doctor is enclosed."',
      denialDateLabel: 'Date of the denial notice',
      numberLabel: 'Claim number'
    },
    assistance: {
      id: 'assistance',
      label: 'Hospital financial-assistance request',
      to: 'Hospital financial assistance / billing office',
      reasonLabel: 'Your situation (optional)',
      reasonHint: 'e.g. "I lost my job in March and my household income has dropped."',
      denialDateLabel: 'Date of the first bill',
      numberLabel: 'Account / invoice number'
    }
  };

  function clean(v) {
    return (v === undefined || v === null) ? '' : String(v).replace(/\r\n?/g, '\n').trim();
  }

  function val(v, placeholder) {
    var c = clean(v);
    return c ? c : '[' + placeholder + ']';
  }

  // Formats YYYY-MM-DD as "March 5, 2026" without timezone shifts. Leaves other input as typed.
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];
  function fmtDate(v, placeholder) {
    var c = clean(v);
    if (!c) return '[' + placeholder + ']';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c);
    if (!m) return c;
    var mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return c;
    return MONTHS[mo - 1] + ' ' + d + ', ' + m[1];
  }

  function header(d) {
    var lines = [];
    lines.push(val(d.name, 'Your full name'));
    lines.push(val(d.address, 'Your mailing address'));
    if (clean(d.contact)) lines.push(clean(d.contact));
    lines.push('');
    lines.push(fmtDate(d.letterDate, "Today's date"));
    lines.push('');
    lines.push(val(d.recipient, 'Provider or insurer name'));
    if (clean(d.recipientAddress)) lines.push(clean(d.recipientAddress));
    lines.push('');
    return lines;
  }

  function patientLine(d) {
    var p = clean(d.patient);
    return p ? p : val(d.name, 'Your full name');
  }

  function signoff(d, enclosures) {
    var lines = ['', 'Sincerely,', '', '', val(d.name, 'Your full name')];
    if (enclosures && enclosures.length) {
      lines.push('');
      lines.push('Enclosures:');
      enclosures.forEach(function (e) { lines.push('- ' + e); });
    }
    return lines;
  }

  function buildItemized(d) {
    var L = header(d);
    L.push('RE: Request for an itemized bill');
    L.push('Patient: ' + patientLine(d));
    L.push('Account number: ' + val(d.number, 'Account number'));
    L.push('Date(s) of service: ' + val(d.serviceDates, 'Date(s) of service'));
    L.push('Bill dated: ' + fmtDate(d.noticeDate, 'Date on the bill'));
    L.push('');
    L.push('To the Billing Department:');
    L.push('');
    L.push('I am writing to request a complete, itemized statement for the account listed above before I make any further payment. Please include, for every charge:');
    L.push('');
    L.push('- the date of service;');
    L.push('- a plain-language description of the item or service;');
    L.push('- the billing code (CPT, HCPCS, or revenue code) and quantity;');
    L.push('- the amount charged; and');
    L.push('- all payments, insurance adjustments, and discounts applied to the account.');
    L.push('');
    L.push('If my insurance was billed, please also tell me the date the claim was submitted and the name of the insurer it was sent to.');
    var r = clean(d.reason);
    if (r) { L.push(''); L.push(r); }
    L.push('');
    L.push('While I review the itemized statement, I ask that you place this account on hold and not refer it to a collection agency. Please send the statement to the address above. If you need anything else from me, please contact me in writing.');
    L.push('');
    L.push('Thank you for your help.');
    return L.concat(signoff(d, []));
  }

  function buildAppeal(d) {
    var L = header(d);
    L.push('RE: Request for internal appeal of denied claim');
    L.push('Patient: ' + patientLine(d));
    L.push('Member / ID number: ' + val(d.memberId, 'Member ID number'));
    L.push('Claim number: ' + val(d.number, 'Claim number'));
    L.push('Date(s) of service: ' + val(d.serviceDates, 'Date(s) of service'));
    L.push('Provider: ' + val(d.provider, 'Doctor or facility that provided the care'));
    L.push('Date of denial notice: ' + fmtDate(d.noticeDate, 'Date of the denial notice'));
    L.push('');
    L.push('To the Appeals Department:');
    L.push('');
    if (d.urgent) {
      L.push('I am requesting an EXPEDITED (urgent) internal appeal. Waiting for a standard decision could seriously jeopardize my life, health, or ability to regain maximum function. I also request an expedited external review at the same time if that is available under my plan.');
      L.push('');
    }
    L.push('I am writing to appeal your decision to deny coverage for the claim listed above and to request a full and fair review.');
    L.push('');
    L.push('Why I believe the denial should be reversed:');
    L.push(val(d.reason, 'Explain in your own words why the care should be covered'));
    L.push('');
    L.push('Please also send me, free of charge, copies of all documents, records, and other information relevant to this claim, including the specific plan provision and any internal rule, guideline, or clinical criteria used to make this decision, and the diagnosis and treatment codes (with their meanings) for this claim.');
    L.push('');
    L.push('Please send me your decision in writing. If the denial is upheld, please explain the specific reasons and tell me how to request an external review.');
    return L.concat(signoff(d, [
      'Copy of the denial notice / Explanation of Benefits',
      'Supporting letter or records from my provider (if available)'
    ]));
  }

  function buildAssistance(d) {
    var L = header(d);
    L.push('RE: Request for financial assistance (charity care)');
    L.push('Patient: ' + patientLine(d));
    L.push('Account number: ' + val(d.number, 'Account number'));
    L.push('Date(s) of service: ' + val(d.serviceDates, 'Date(s) of service'));
    L.push('First bill dated: ' + fmtDate(d.noticeDate, 'Date of the first bill'));
    L.push('');
    L.push('To the Financial Assistance Office:');
    L.push('');
    L.push('I am writing to apply for financial assistance under your hospital\'s financial assistance policy for the account listed above.');
    var r = clean(d.reason);
    if (r) { L.push(''); L.push(r); }
    L.push('');
    L.push('Please send me:');
    L.push('- a copy of your financial assistance policy and its plain-language summary;');
    L.push('- the application form and a list of any documents you need from me; and');
    L.push('- the name and phone number of someone who can help me complete the application.');
    L.push('');
    L.push('Please consider this letter the start of my application. While my application is being reviewed, I ask that you suspend all collection activity on this account, including referral to a collection agency or credit reporting. If I qualify, please apply the assistance to this account and refund any amount I have already paid above what I owe.');
    L.push('');
    L.push('Please send your decision to me in writing. Thank you for your help.');
    return L.concat(signoff(d, ['Proof of income (if available)']));
  }

  function buildLetter(type, data) {
    var d = data || {};
    var lines;
    if (type === 'itemized') lines = buildItemized(d);
    else if (type === 'appeal') lines = buildAppeal(d);
    else if (type === 'assistance') lines = buildAssistance(d);
    else throw new Error('Unknown letter type: ' + type);
    return lines.join('\n') + '\n';
  }

  function fileName(type, data) {
    var base = { itemized: 'itemized-bill-request', appeal: 'insurance-appeal', assistance: 'financial-assistance-request' }[type] || 'letter';
    var dt = clean(data && data.letterDate);
    return base + (/^\d{4}-\d{2}-\d{2}$/.test(dt) ? '-' + dt : '') + '.txt';
  }

  var api = { LETTERS: LETTERS, buildLetter: buildLetter, fileName: fileName, fmtDate: fmtDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KitLetters = api;
})(typeof window !== 'undefined' ? window : this);
