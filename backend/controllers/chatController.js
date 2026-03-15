'use strict';

const Recipe = require('../models/Recipe');
const ChatSession = require('../models/ChatSession');
const Config = require('../Config');
const { buildSystemPrompt } = require('../utils/promptBuilder');
const { callLLM } = require('../utils/llmProvider');
const logger = require('../utils/logger');

/**
 * GET /api/chat/recipe/:recipeId/session
 * Find or create a ChatSession for the authenticated user + recipe.
 */
async function getOrCreateSession(req, res) {
  try {
    const userId = req.user.userId;
    const { recipeId } = req.params;

    // Verify recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Find or create session (upsert)
    const session = await ChatSession.findOneAndUpdate(
      { userId, recipeId },
      { $setOnInsert: { userId, recipeId, messages: [] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      sessionId: session._id,
      messages: session.messages
    });
  } catch (err) {
    logger.error('getOrCreateSession error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/chat/recipe/:recipeId/message
 * Append user message, call OpenAI, append assistant reply, persist session.
 */
async function sendMessage(req, res) {
  try {
    // Check AI is enabled
    const appConfig = await Config.findOne();
    if (!appConfig || !appConfig.aiEnabled) {
      return res.status(503).json({ error: 'AI features are disabled' });
    }
    const provider = appConfig.llmProvider || 'openai';
    const hasKey = provider === 'custom'
      ? !!(appConfig.customLlmApiKey || appConfig.customLlmBaseUrl)
      : !!(appConfig.openaiApiKey || process.env.OPENAI_API_KEY);
    if (!hasKey) {
      return res.status(503).json({ error: 'AI API key not configured' });
    }

    const userId = req.user.userId;
    const { recipeId } = req.params;
    const { sessionId, message } = req.body;

    // Load and verify session ownership
    const session = await ChatSession.findById(sessionId);
    if (!session || String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    // Load recipe with populated ingredients
    const recipe = await Recipe.findById(recipeId).populate('ingredients.ingredient');
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Append user message
    session.messages.push({ role: 'user', content: message, timestamp: Date.now() });

    // Build conversation window (last 20 messages)
    const systemPrompt = buildSystemPrompt(recipe);
    const window = session.messages.slice(-20);
    const openAIMessages = [
      { role: 'system', content: systemPrompt },
      ...window.map(m => ({ role: m.role, content: m.content }))
    ];

    // Log only metadata — never message content
    logger.info('Chat message sent', {
      userId: String(userId),
      recipeId: String(recipeId),
      timestamp: new Date().toISOString()
    });

    // Call LLM
    let reply;
    try {
      reply = await callLLM(appConfig, openAIMessages, { max_tokens: 600, temperature: 0.8 });
    } catch (openAIErr) {
      // Content policy violation (400 with content filter)
      if (
        openAIErr.status === 400 &&
        openAIErr.error &&
        openAIErr.error.code === 'content_filter'
      ) {
        // Save user message but NOT assistant reply
        await session.save();
        return res.status(422).json({
          error: 'Message could not be processed. Please rephrase.'
        });
      }

      // 5xx or timeout — do NOT save
      return res.status(503).json({
        error: 'AI service temporarily unavailable. Please try again.'
      });
    }

    // Append assistant reply
    session.messages.push({ role: 'assistant', content: reply, timestamp: Date.now() });

    // Prune to last 100 messages if over limit
    if (session.messages.length > 100) {
      session.messages = session.messages.slice(-100);
    }

    await session.save();

    return res.status(200).json({ reply, sessionId: session._id });
  } catch (err) {
    logger.error('sendMessage error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * DELETE /api/chat/recipe/:recipeId/session
 * Delete the ChatSession for the authenticated user + recipe.
 */
async function clearSession(req, res) {
  try {
    const userId = req.user.userId;
    const { recipeId } = req.params;

    const session = await ChatSession.findOne({ userId, recipeId });
    if (!session || String(session.userId) !== String(userId)) {
      return res.status(403).json({ error: 'Invalid session' });
    }

    await session.deleteOne();

    return res.status(200).json({ message: 'Session cleared' });
  } catch (err) {
    logger.error('clearSession error', { error: err.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getOrCreateSession, sendMessage, clearSession };
