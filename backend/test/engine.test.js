import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoiceBotEngine } from '../engine.js';

describe('VoiceBotEngine', () => {
  beforeEach(() => {
    // Set mock API keys so it doesn't fall back to Mock Mode logic automatically
    process.env.DEEPGRAM_API_KEY = 'mock_deepgram';
    process.env.GEMINI_API_KEY = 'mock_gemini';
    process.env.SARVAM_API_KEY = 'mock_sarvam';
  });

  it('should chunk sentences and enqueue them for TTS', async () => {
    const mockWs = { send: vi.fn(), readyState: 1 };
    
    const engine = new VoiceBotEngine(mockWs);
    
    // Spy on enqueueTTS
    const enqueueSpy = vi.spyOn(engine, 'enqueueTTS');
    
    // Mock Gemini
    engine.gemini = {
      models: {
        generateContentStream: vi.fn().mockResolvedValue((async function* () {
          yield { text: 'Namaste. ' };
          yield { text: 'Main Raj ' };
          yield { text: 'hoon, ' };
          yield { text: 'kya aap meri madad kar sakte hain? Haan!' };
        })())
      }
    };

    // Prevent actual TTS HTTP requests from running
    vi.spyOn(engine, 'generateTTSAndPlay').mockResolvedValue();

    await engine.triggerLLM();

    expect(enqueueSpy).toHaveBeenCalledWith('Namaste.');
    expect(enqueueSpy).toHaveBeenCalledWith('Main Raj hoon,');
    expect(enqueueSpy).toHaveBeenCalledWith('kya aap meri madad kar sakte hain?');
    expect(enqueueSpy).toHaveBeenCalledWith('Haan!');
    
    // Ensure that chat history updated correctly
    expect(engine.chatHistory[engine.chatHistory.length - 1].content).toBe(
      'Namaste. Main Raj hoon, kya aap meri madad kar sakte hain? Haan!'
    );
  });
});
