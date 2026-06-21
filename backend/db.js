import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbPromise;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, 'ringg.sqlite'),
      driver: sqlite3.Database
    });

    const db = await dbPromise;

    // Initialize tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        voice TEXT,
        language TEXT,
        system_prompt TEXT,
        status TEXT DEFAULT 'Active'
      );

      CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        call_id TEXT,
        phone_number TEXT,
        duration TEXT,
        status TEXT,
        cost TEXT,
        transcript TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert default agents if empty
    const count = await db.get('SELECT COUNT(*) as count FROM agents');
    if (count.count === 0) {
      await db.exec(`
        INSERT INTO agents (name, role, voice, language, system_prompt, status) VALUES 
        ('Sales_Sarah_EN', 'Lead Qualification', 'ElevenLabs - Rachel', 'English (US)', 'You are Sarah, a sales agent.', 'Active');
        INSERT INTO agents (name, role, voice, language, system_prompt, status) VALUES 
        ('Collector_Raj_HI', 'Debt Collection', 'Sarvam AI - Bulbul', 'Hindi (IN)', 'You are Raj, a debt collector. Be polite but firm. Ask the user for their overdue payment of 500 rupees. Speak entirely in Hindi.', 'Active');
        INSERT INTO agents (name, role, voice, language, system_prompt, status) VALUES 
        ('Support_Priya_MR', 'Customer Support', 'Sarvam AI - Bulbul', 'Marathi (IN)', 'You are Priya, customer support.', 'Draft');
      `);
      
      // Insert mock calls to populate the dashboard initially
      await db.exec(`
        INSERT INTO call_logs (call_id, phone_number, duration, status, cost, transcript) VALUES
        ('CLL-092', '+91 98765 43210', '2m 14s', 'Qualified', '$0.42', 'Mock transcript...');
        INSERT INTO call_logs (call_id, phone_number, duration, status, cost, transcript) VALUES
        ('CLL-091', '+91 91234 56789', '0m 45s', 'Voicemail', '$0.12', 'Mock transcript...');
        INSERT INTO call_logs (call_id, phone_number, duration, status, cost, transcript) VALUES
        ('CLL-090', '+91 99887 76655', '4m 20s', 'Requires Follow-up', '$0.84', 'Mock transcript...');
      `);
    }
  }
  return dbPromise;
}
