const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const { calculateLeadIntelligence } = require('./aiEngine');

/**
 * Validates and parses raw CSV string/buffer into Lead documents
 */
async function parseAndValidateCSV(bufferOrString, ownerId, LeadModel) {
  const records = parse(bufferOrString, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const validLeads = [];
  const errors = [];
  const seenEmails = new Set();

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const rowNumber = i + 2; // Accounting for 1-based index and header row

    // Mandatory fields
    if (!row.name || row.name.trim().length === 0) {
      errors.push({ row: rowNumber, field: 'name', message: 'Missing lead contact name' });
      continue;
    }

    if (!row.email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(row.email.trim())) {
      errors.push({ row: rowNumber, field: 'email', message: `Invalid email address: '${row.email}'` });
      continue;
    }

    if (!row.company || row.company.trim().length === 0) {
      errors.push({ row: rowNumber, field: 'company', message: 'Missing company name' });
      continue;
    }

    const email = row.email.trim().toLowerCase();

    // Check duplicate inside this CSV batch
    if (seenEmails.has(email)) {
      errors.push({ row: rowNumber, field: 'email', message: `Duplicate email within CSV: '${email}'` });
      continue;
    }
    seenEmails.add(email);

    // Check duplicate in database for this owner/workspace
    const existing = await LeadModel.findOne({ email, owner: ownerId });
    if (existing) {
      errors.push({ row: rowNumber, field: 'email', message: `Lead with email '${email}' already exists in workspace` });
      continue;
    }

    // Parse numeric dealValue
    let dealValue = 5000;
    if (row.dealValue) {
      const parsedVal = parseFloat(row.dealValue.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedVal) && parsedVal >= 0) {
        dealValue = parsedVal;
      }
    }

    const leadData = {
      name: row.name.trim(),
      email,
      phone: row.phone ? row.phone.trim() : '',
      company: row.company.trim(),
      jobTitle: row.jobTitle ? row.jobTitle.trim() : 'Decision Maker',
      industry: row.industry ? row.industry.trim() : 'Technology',
      source: row.source ? row.source.trim() : 'Website',
      dealValue,
      status: row.status ? row.status.trim() : 'New',
      priority: row.priority ? row.priority.trim() : 'Medium',
      notes: row.notes ? row.notes.trim() : 'Imported via CSV batch upload',
      owner: ownerId,
      assignedTo: ownerId
    };

    // Run AI Engine scoring on imported lead
    const aiResults = calculateLeadIntelligence(leadData, []);
    Object.assign(leadData, aiResults);

    validLeads.push(leadData);
  }

  return { validLeads, errors, totalProcessed: records.length };
}

/**
 * Exports database leads to CSV format
 */
function exportLeadsToCSV(leads) {
  const formattedRows = leads.map(lead => ({
    ID: lead._id.toString(),
    Name: lead.name,
    Email: lead.email,
    Phone: lead.phone || '',
    Company: lead.company,
    JobTitle: lead.jobTitle,
    Industry: lead.industry,
    Source: lead.source,
    DealValue: lead.dealValue,
    Status: lead.status,
    Priority: lead.priority,
    AIScore: lead.aiScore,
    AICategory: lead.aiCategory,
    ConversionLikelihood: `${lead.conversionLikelihood}%`,
    NextBestAction: lead.nextBestAction?.action || '',
    NextBestActionReason: lead.nextBestAction?.reason || '',
    AssignedTo: lead.assignedTo?.name || 'Unassigned',
    CreatedAt: lead.createdAt ? new Date(lead.createdAt).toISOString() : ''
  }));

  return stringify(formattedRows, { header: true });
}

module.exports = {
  parseAndValidateCSV,
  exportLeadsToCSV
};
