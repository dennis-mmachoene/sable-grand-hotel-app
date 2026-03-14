const { GoogleGenAI } = require('@google/genai');
const { ChatLog, HotelInfo } = require('../models/Other');
const { sendSuccess, sendError, asyncHandler } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

let ai;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Model cascade: lite first (generous free tier), flash as fallback
const MODELS = [
  'gemini-3.1-flash-lite',  // 15 RPM, 500 RPD — your best free option
  'gemini-2.5-flash-lite',  // 10 RPM, 20 RPD — fallback
  'gemini-2.5-flash',       // 5 RPM,  20 RPD — last resort
];

const FALLBACK_RESPONSES = [
  "Aria is assisting many guests right now. Please try again in a moment or call us on +27 11 555 0100.",
  "Our concierge lines are busy. Please wait a moment and try again, or email info@sablegrand.co.za.",
  "I'm temporarily unavailable. For immediate assistance, please contact our front desk on +27 11 555 0100.",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const buildSystemPrompt = async () => {
  const info = await HotelInfo.findOne({ isActive: true });

  const name      = info?.name                   || 'Sable Grand';
  const checkIn   = info?.policies?.checkInTime  || '14:00';
  const checkOut  = info?.policies?.checkOutTime || '11:00';
  const amenities = info?.amenities?.join(', ')  || 'Infinity Pool, Spa & Wellness, Fitness Centre, The Acacia Restaurant, Sky Bar, Business Centre, Free Wi-Fi, Valet Parking';
  const city      = info?.address?.city          || 'Sandton, Johannesburg';
  const phone     = info?.contact?.phone         || '+27 11 555 0100';
  const email     = info?.contact?.email         || 'info@sablegrand.co.za';
  const taxRate   = info?.taxRate                || 15;

  return `You are Aria, the AI concierge for ${name} hotel in ${city}, South Africa.
You are helpful, warm, professional, and knowledgeable about all hotel services.

HOTEL INFORMATION:
- Hotel: ${name} (5-star luxury)
- Location: ${city}, Gauteng, South Africa
- Time zone: SAST (UTC+2)
- Currency: South African Rand (ZAR / R)
- Check-in: ${checkIn} SAST
- Check-out: ${checkOut} SAST
- Phone: ${phone}
- Email: ${email}
- VAT: ${taxRate}% included in quoted prices

ROOMS & PRICING (ZAR, incl. ${taxRate}% VAT):
- Standard: from R 1,800/night — Refined comfort, king or twin beds
- Deluxe: from R 3,200/night — City/pool views, premium furnishings
- Suite: from R 5,500/night — Separate living areas, jacuzzi, butler option
- Presidential: from R 18,000/night — Ultimate luxury, 24h butler, full kitchen

DINING:
- The Acacia: Fine dining, open 06:30–22:30 SAST
- Sky Bar & Lounge: Rooftop cocktails, 16:00–01:00 SAST
- Pool Terrace: Light meals, 10:00–20:00 SAST
- Room Service: Available 24/7

AMENITIES: ${amenities}

POLICIES:
- Cancellation: Free up to 48 hours before arrival; after that, one night charge applies
- Pets: Not permitted (certified assistance animals welcome)
- Smoking: Designated outdoor areas only (all rooms non-smoking)
- Wi-Fi: Complimentary throughout
- Parking: Valet and self-parking available
- Airport transfer: Book via concierge (${phone})

INSTRUCTIONS:
1. Answer ONLY hotel, room, booking, amenity, local area, and service questions.
2. Be warm, concise (2–4 sentences unless more detail needed), and professional.
3. Always quote prices in ZAR (R). When asked for USD conversion, use approx R18.50 per $1.
4. For specific reservation changes or cancellations, direct guest to log in or call ${phone}.
5. If unsure, say "Please contact our front desk for accurate details."
6. Do NOT discuss non-hotel topics.
7. Reference South African context naturally (e.g., "braai evenings", "sundowner cocktails").`;
};

/**
 * Try each model in MODELS cascade.
 * On 429, wait for retryDelay from the error then try the next model.
 * Returns { reply, modelUsed } or throws if all models exhausted.
 */
const callGeminiWithFallback = async (systemPrompt, chatHistory, message) => {
  let lastError;

  for (const model of MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        history: chatHistory,
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 350,
          temperature: 0.4,
          topP: 0.85,
        },
      });

      const result = await chat.sendMessage({ message });
      return { reply: result.text, modelUsed: model };

    } catch (err) {
      lastError = err;
      const status = err.status ?? err?.error?.code;

      if (status === 429) {
        // Extract retryDelay from error details if available, cap at 10s so UX isn't broken
        let waitMs = 3000;
        try {
          const details = JSON.parse(err.message)?.error?.details ?? [];
          const retryInfo = details.find(d => d['@type']?.includes('RetryInfo'));
          if (retryInfo?.retryDelay) {
            // retryDelay is like "57s" — parse it but cap at 10s for UX
            const seconds = parseInt(retryInfo.retryDelay, 10);
            waitMs = Math.min(seconds * 1000, 10000);
          }
        } catch (_) { /* ignore parse errors */ }

        console.warn(`[Gemini] ${model} rate-limited. Waiting ${waitMs}ms before trying next model...`);
        await sleep(waitMs);
        continue; // try next model
      }

      if (status === 404) {
        console.warn(`[Gemini] ${model} not found (404), trying next model...`);
        continue; // try next model immediately
      }

      // Any other error — don't cascade, surface it
      throw err;
    }
  }

  throw lastError;
};

const sendMessage = asyncHandler(async (req, res) => {
  if (!ai) {
    return sendError(res, 'Chatbot service unavailable. Please configure GEMINI_API_KEY.', 503);
  }

  const { message, sessionId, history = [] } = req.body;
  if (!message?.trim())     return sendError(res, 'Message cannot be empty', 400);
  if (message.length > 500) return sendError(res, 'Message too long (max 500 characters)', 400);

  const currentSessionId = sessionId || uuidv4();

  try {
    const systemPrompt = await buildSystemPrompt();

    const chatHistory = history.slice(-10).map(msg => ({
      role:  msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const { reply, modelUsed } = await callGeminiWithFallback(systemPrompt, chatHistory, message);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Gemini] Responded using model: ${modelUsed}`);
    }

    // Save log (non-blocking)
    ChatLog.findOneAndUpdate(
      { sessionId: currentSessionId },
      {
        $setOnInsert: { sessionId: currentSessionId, user: req.user?._id },
        $push: { messages: [{ role: 'user', content: message }, { role: 'assistant', content: reply }] },
        $inc:  { totalMessages: 2 },
      },
      { upsert: true, new: true }
    ).catch(() => {});

    return sendSuccess(res, { message: reply, sessionId: currentSessionId });

  } catch (err) {
    console.error('[Gemini] All models failed:', err?.status ?? err?.message);

    // All models rate-limited — return a friendly fallback message instead of a 500
    if (err.status === 429 || err.message?.includes('429')) {
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
      return sendSuccess(res, { message: fallback, sessionId: currentSessionId, degraded: true });
    }

    return sendError(res, "I'm having a moment — please try again or call us on +27 11 555 0100.", 500);
  }
});

const getChatHistory = asyncHandler(async (req, res) => {
  const log = await ChatLog.findOne({ sessionId: req.params.sessionId });
  return sendSuccess(res, { messages: log?.messages || [] });
});

module.exports = { sendMessage, getChatHistory };