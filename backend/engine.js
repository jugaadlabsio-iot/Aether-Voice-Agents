import { createClient } from '@deepgram/sdk';
import { GoogleGenAI } from '@google/genai';

/**
 * Full-Stack Voice Bot Engine
 * Integrates Deepgram (STT), Gemini (LLM), and Sarvam AI (TTS).
 */
export class VoiceBotEngine {
  constructor(clientWs, options = {}) {
    this.clientWs = clientWs;
    
    // Services
    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    this.sarvamApiKey = process.env.SARVAM_API_KEY;

    // Hardening: Mock Mode
    this.isMockMode = !process.env.GEMINI_API_KEY || !this.sarvamApiKey;
    this.isSttMockMode = !this.deepgramApiKey;
    
    // Agent Config
    this.language = options.language || 'hi-IN';
    this.speaker = options.speaker || 'meera';
    
    // State
    this.isBotSpeaking = false;
    this.ttsQueue = [];
    this.isTTSProcessing = false;
    this.ttsAbortController = null;
    this.llmAbortController = null;
    const defaultPrompt = 'You are a helpful AI voice assistant for a business. Keep your answers brief (1-2 sentences) and conversational in Hindi. Do not use markdown or special characters. Say Namaste to start.';
    this.chatHistory = [
      { role: 'user', content: options.systemPrompt || defaultPrompt }
    ];
    
    this.initDeepgram();
  }

  initDeepgram() {
    if (this.isSttMockMode) {
      console.log('[Engine] STT MOCK MODE (Deepgram Key missing). Skipping Deepgram connection.');
      setTimeout(() => this.triggerLLM("Start the conversation by greeting me in Hindi."), 1000);
      return;
    }

    try {
      const deepgram = createClient(this.deepgramApiKey);
      
      this.deepgramLive = deepgram.listen.live({
        model: 'nova-2',
        smart_format: true,
        endpointing: 500,
        interim_results: true,
        filler_words: true,
      });

      this.deepgramLive.on('open', () => {
        console.log('[Engine] Deepgram connection opened');
        this.triggerLLM("Start the conversation by greeting me in Hindi.");
      });

      this.deepgramLive.on('Results', (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        
        if (transcript.length > 0 && data.is_final) {
          if (this.isBotSpeaking) {
            this.interruptBot();
          }
          
          console.log(`[User]: ${transcript}`);
          this.chatHistory.push({ role: 'user', content: transcript });
          
          if (data.speech_final) {
            this.triggerLLM();
          }
        }
      });

      this.deepgramLive.on('error', (err) => {
        console.error('[Engine] Deepgram error:', err);
      });
    } catch (err) {
      console.error('[Engine] Deepgram Initialization Failed:', err);
    }
  }

  handleIncomingAudio(audioBuffer) {
    if (this.isSttMockMode) {
      if (!this.mockSpeechTimeout) {
        console.log('[Engine] STT MOCK MODE: Receiving audio chunks from browser...');
        this.mockSpeechTimeout = setTimeout(() => {
          console.log('[Engine] STT MOCK MODE: Simulated Speech Endpoint Detected.');
          this.chatHistory.push({ role: 'user', content: 'MOCK USER SPEECH: Namaste, kya aap mujhe sun sakte hain?' });
          this.triggerLLM();
          this.mockSpeechTimeout = null;
        }, 2500); // Trigger LLM 2.5 seconds after first audio chunk
      }
      return;
    }

    if (this.deepgramLive && this.deepgramLive.getReadyState() === 1) {
      this.deepgramLive.send(audioBuffer);
    }
  }

  interruptBot() {
    console.log('[Engine] User interrupted! Stopping bot speech...');
    this.isBotSpeaking = false;
    this.ttsQueue = []; // Clear pending TTS requests
    
    if (this.ttsAbortController) {
      this.ttsAbortController.abort();
      this.ttsAbortController = null;
    }
    
    if (this.llmAbortController) {
      this.llmAbortController.abort();
      this.llmAbortController = null;
    }
    
    if (this.clientWs.readyState === 1) {
      this.clientWs.send(JSON.stringify({ event: 'clear' }));
    }
  }

  async triggerLLM(promptOverride = null) {
    console.log('[Engine] Gemini is thinking...');

    if (this.isMockMode) {
      setTimeout(async () => {
        const mockResponse = "Namaste! Main Raj hoon. Aapka payment overdue hai. Kripya 500 rupaye chukayen.";
        console.log(`[Bot Mock]: ${mockResponse}`);
        this.chatHistory.push({ role: 'assistant', content: mockResponse });
        await this.generateTTSAndPlay(mockResponse);
      }, 500);
      return;
    }
    
    try {
      if (promptOverride) {
        this.chatHistory.push({ role: 'user', content: promptOverride });
      }

      const geminiContents = this.chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      this.llmAbortController = new AbortController();

      const responseStream = await this.gemini.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: geminiContents,
        config: {
          systemInstruction: this.chatHistory[0].content // use first msg as system instruction if possible or pass it inside contents
        }
      }, { signal: this.llmAbortController.signal });

      let fullResponse = '';
      let currentSentence = '';

      for await (const chunk of responseStream) {
         const text = chunk.text;
         if (!text) continue;

         fullResponse += text;
         currentSentence += text;

         // Detect sentence boundaries (., !, ?, ।, ,) followed by space or end
         const match = currentSentence.match(/([.?!।,])(\s|$)/);
         if (match) {
             const splitIndex = match.index + match[1].length;
             const sentenceToPlay = currentSentence.substring(0, splitIndex).trim();
             currentSentence = currentSentence.substring(splitIndex);

             if (sentenceToPlay.length > 0) {
                 this.enqueueTTS(sentenceToPlay);
             }
         }
      }

      if (currentSentence.trim().length > 0) {
        this.enqueueTTS(currentSentence.trim());
      }

      console.log(`[Bot]: ${fullResponse}`);
      this.chatHistory.push({ role: 'assistant', content: fullResponse });

    } catch (err) {
      if (err.name === 'AbortError') {
         console.log('[Engine] Gemini generation aborted due to interruption.');
      } else {
         console.error('[Engine] Gemini Error:', err);
      }
    } finally {
      this.llmAbortController = null;
    }
  }

  enqueueTTS(text) {
    this.ttsQueue.push(text);
    this.processTTSQueue();
  }

  async processTTSQueue() {
    if (this.isTTSProcessing || this.ttsQueue.length === 0) return;
    this.isTTSProcessing = true;

    while (this.ttsQueue.length > 0) {
      const text = this.ttsQueue.shift();
      if (!text) break;
      await this.generateTTSAndPlay(text);
    }

    this.isTTSProcessing = false;
  }

  async generateTTSAndPlay(text) {
    this.isBotSpeaking = true;
    console.log(`[Engine] Sending to Sarvam AI TTS...`);

    if (this.isMockMode) {
      setTimeout(() => {
        console.log(`[Engine] MOCK MODE: TTS Audio Stream Completed.`);
        if (this.clientWs.readyState === 1) {
          this.clientWs.send(JSON.stringify({
            event: 'mock-text',
            text: text
          }));
        }
        this.isBotSpeaking = false;
      }, 500);
      return;
    }
    
    this.ttsAbortController = new AbortController();
    try {
      const response = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': this.sarvamApiKey
        },
        signal: this.ttsAbortController.signal,
        body: JSON.stringify({
          inputs: [text],
          target_language_code: this.language,
          speaker: this.speaker,
          pitch: 0,
          pace: 1.0,
          loudness: 1.5,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
          model: 'bulbul:v1'
        })
      });

      if (!response.ok) {
        throw new Error(`Sarvam API failed with status ${response.status}`);
      }

      const data = await response.json();
      const base64Audio = data.audios[0];

      if (this.isBotSpeaking && this.clientWs.readyState === 1) {
        this.clientWs.send(JSON.stringify({
          event: 'media',
          media: { payload: base64Audio }
        }));
      }

      const speakingDurationMs = Math.max(2000, text.length * 100);
      setTimeout(() => {
        this.isBotSpeaking = false;
      }, speakingDurationMs);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[Engine] Sarvam TTS request aborted.');
      } else {
        console.error('[Engine] Sarvam TTS Error:', err);
      }
      this.isBotSpeaking = false;
    } finally {
      this.ttsAbortController = null;
    }
  }

  async cleanup() {
    if (this.deepgramLive) {
      try {
        this.deepgramLive.finish();
      } catch (e) {
        console.error('Error cleaning up deepgram', e);
      }
    }
    
    // Save call to database
    try {
      if (this.chatHistory.length > 1) {
        const { getDb } = await import('./db.js');
        const db = await getDb();
        
        const transcriptText = this.chatHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
        const callId = 'CLL-' + Math.floor(Math.random() * 900 + 100);
        const durationStr = `${Math.floor(Math.random() * 3 + 1)}m ${Math.floor(Math.random() * 59)}s`; // Mock duration
        const status = 'Completed';
        const cost = '$0.15';
        
        await db.run(
          'INSERT INTO call_logs (call_id, phone_number, duration, status, cost, transcript) VALUES (?, ?, ?, ?, ?, ?)',
          [callId, '+1 (Test Web)', durationStr, status, cost, transcriptText]
        );
        console.log(`[Engine] Saved Call Log ${callId} to Database`);
      }
    } catch (e) {
      console.error('[Engine] Failed to save call log:', e);
    }
  }
}
