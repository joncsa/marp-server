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
 
// POST /convert  body: { markdown: "...", type: "pptx" | "pdf" | "html" }
app.post('/convert', (req, res) => {
  const { markdown, type = 'pptx' } = req.body;
 
  if (!markdown) {
    return res.status(400).json({ error: 'No markdown provided' });
  }
 
  const ts = Date.now();
  const tempMd  = path.join(os.tmpdir(), `marp-${ts}.md`);
  const tempOut = path.join(os.tmpdir(), `marp-${ts}.${type}`);
 
  try {
    fs.writeFileSync(tempMd, markdown);
    execSync(
      `marp ${tempMd} -o ${tempOut} --allow-local-files`,
      {
        stdio: 'pipe',
        env: { ...process.env, CHROME_PATH: '/usr/bin/chromium-browser' }
      }
    );
 
    const fileBuffer = fs.readFileSync(tempOut);
    const mimeTypes = {
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      pdf:  'application/pdf',
      html: 'text/html'
    };
 
    res.setHeader('Content-Type', mimeTypes[type] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="presentation.${type}"`);
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
