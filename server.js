const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
 
const app = express();
app.use(express.json({ limit: '10mb' }));
 
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
 
// POST /convert  body: { markdown: "...", type: "html" }
// PPTX requires Chromium - use html output and convert locally if needed
app.post('/convert', (req, res) => {
  const { markdown, type = 'html' } = req.body;
 
  if (!markdown) {
    return res.status(400).json({ error: 'No markdown provided' });
  }
 
  // Force html if pptx requested (no Chromium available)
  const outputType = (type === 'pptx' || type === 'pdf') ? 'html' : type;
 
  const ts = Date.now();
  const tempMd  = path.join(os.tmpdir(), `marp-${ts}.md`);
  const tempOut = path.join(os.tmpdir(), `marp-${ts}.${outputType}`);
 
  try {
    fs.writeFileSync(tempMd, markdown);
    execSync(
      `marp ${tempMd} -o ${tempOut}`,
      { stdio: 'pipe' }
    );
 
    const fileBuffer = fs.readFileSync(tempOut);
    const mimeTypes = {
      html: 'text/html',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf:  'application/pdf'
    };
 
    res.setHeader('Content-Type', mimeTypes[outputType] || 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="presentation.${outputType}"`);
    res.send(fileBuffer);
 
  } catch (err) {
    res.status(500).json({ error: 'Conversion failed', details: err.message });
  } finally {
    try { fs.unlinkSync(tempMd); } catch {}
    try { fs.unlinkSync(tempOut); } catch {}
  }
});
 
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Marp service running on port ${PORT}`));
