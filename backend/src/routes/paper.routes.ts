import { Router } from 'express';
import mongoose from 'mongoose';
import puppeteer from 'puppeteer';
import { redisClient } from '../lib/redis';
import { QuestionPaper } from '../models/QuestionPaper';

const router = Router();

router.get('/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Validate it is a valid ObjectId before querying
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID format' });
    }

    // Check Redis cache first
    const cached = await redisClient.get(`paper:${assignmentId}`);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Convert string to ObjectId for the query
    const paper = await QuestionPaper.findOne({ 
      assignmentId: new mongoose.Types.ObjectId(assignmentId) 
    });
    
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found. It may still be generating.' });
    }

    // Cache for next time
    await redisClient.setex(`paper:${assignmentId}`, 3600, JSON.stringify(paper));

    return res.json(paper);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:assignmentId/pdf', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ error: 'Invalid assignment ID format' });
    }

    const redisKey = `pdf:${assignmentId}`;
    
    // Check Redis for cached PDF buffer
    // ioredis supports getBuffer for binary data
    const cachedPdf = await redisClient.getBuffer(redisKey);
    
    if (cachedPdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="question_paper_${assignmentId}.pdf"`);
      return res.send(cachedPdf);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const printUrl = `${frontendUrl}/print/${assignmentId}`;

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    // Go to the print page and wait for rendering
    await page.goto(printUrl, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    // Cache the buffer in Redis with TTL 1 hour (3600 seconds)
    const nodeBuffer = Buffer.from(pdfBuffer);
    await redisClient.setex(redisKey, 3600, nodeBuffer);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="question_paper_${assignmentId}.pdf"`);
    return res.send(nodeBuffer);
  } catch (error: any) {
    console.error('PDF Generation error:', error);
    return res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

export default router;
