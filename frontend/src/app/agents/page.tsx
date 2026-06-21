"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Settings2, Play, MoreVertical, PhoneCall, PhoneOff, Loader2 } from "lucide-react";
import { useVoiceEngine } from "@/hooks/useVoiceEngine";

export default function AgentsPage() {
  const { isActive, isConnecting, startCall, endCall } = useVoiceEngine();
  
  const [agents, setAgents] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: '', role: '', language: 'English (US)', voice: 'ElevenLabs - Rachel', system_prompt: '' });
  
  // State for the Guardrail Script for Test Calls
  const [testScript, setTestScript] = useState("");
  const [testAgentId, setTestAgentId] = useState<number | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/agents')
      .then(res => res.json())
      .then(data => setAgents(data))
      .catch(console.error);
  }, []);

  const handleCreate = async () => {
    const res = await fetch('http://localhost:3001/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAgent)
    });
    if (res.ok) {
      const agent = await res.json();
      setAgents([...agents, agent]);
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI Agent Studio</h1>
          <p className="text-gray-400 mt-1">Configure personas, scripts, and voices for your AI agents.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black px-4 py-2 rounded-lg font-medium flex items-center hover:bg-gray-200 transition-colors">
          <Plus className="w-5 h-5 mr-2" />
          Create New Agent
        </button>
      </div>

      {isCreating && (
        <div className="mb-8 bg-white/10 p-6 rounded-2xl border border-white/20">
          <h2 className="text-xl text-white mb-4">Create New Agent</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input type="text" placeholder="Name (e.g. Sales_Sarah)" className="bg-black/50 p-2 rounded text-white border border-white/10" value={newAgent.name} onChange={e => setNewAgent({...newAgent, name: e.target.value})} />
            <input type="text" placeholder="Role (e.g. Lead Gen)" className="bg-black/50 p-2 rounded text-white border border-white/10" value={newAgent.role} onChange={e => setNewAgent({...newAgent, role: e.target.value})} />
            <input type="text" placeholder="Language" className="bg-black/50 p-2 rounded text-white border border-white/10" value={newAgent.language} onChange={e => setNewAgent({...newAgent, language: e.target.value})} />
            <input type="text" placeholder="Voice Engine" className="bg-black/50 p-2 rounded text-white border border-white/10" value={newAgent.voice} onChange={e => setNewAgent({...newAgent, voice: e.target.value})} />
          </div>
          <textarea placeholder="System Prompt" className="w-full bg-black/50 p-2 rounded text-white border border-white/10 mb-4 h-24" value={newAgent.system_prompt} onChange={e => setNewAgent({...newAgent, system_prompt: e.target.value})} />
          <div className="flex space-x-2">
            <button onClick={handleCreate} className="bg-cyan-500 text-white px-4 py-2 rounded">Save Agent</button>
            <button onClick={() => setIsCreating(false)} className="bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {agents.map((agent, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm group hover:border-cyan-500/50 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <button className="text-gray-500 hover:text-white transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-1">{agent.name}</h3>
            <p className="text-sm text-gray-400 mb-6">{agent.role}</p>

            <div className="space-y-3 mb-6 flex-1">
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Language:</span>
                <span className="text-gray-200 font-medium">{agent.language}</span>
              </div>
              <div className="flex items-center text-sm">
                <span className="text-gray-500 w-20">Voice:</span>
                <span className="text-gray-200 font-medium flex items-center">
                  {agent.voice}
                  <button className="ml-2 text-cyan-400 hover:text-cyan-300">
                    <Play className="w-4 h-4" />
                  </button>
                </span>
              </div>

              {testAgentId === agent.id && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <label className="block text-sm text-gray-400 mb-2">Live System Prompt:</label>
                  <textarea 
                    value={testScript}
                    onChange={(e) => setTestScript(e.target.value)}
                    rows={4}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-gray-200 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-sm">
              <span className={`flex items-center ${agent.status === 'Active' ? 'text-emerald-400' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full mr-2 ${agent.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-400'}`}></span>
                {agent.status}
              </span>
              
              <div className="flex space-x-2">
                {testAgentId !== agent.id && (
                  <button onClick={() => { setTestAgentId(agent.id); setTestScript(agent.system_prompt || ''); }} className="text-gray-400 hover:text-white flex items-center transition-colors">
                    <Settings2 className="w-4 h-4 mr-1" /> Configure
                  </button>
                )}
                {testAgentId === agent.id && (
                  <button 
                    onClick={() => isActive ? endCall() : startCall(testScript)}
                    disabled={isConnecting}
                    className={`flex items-center px-3 py-1.5 rounded-md font-medium transition-colors ${
                      isActive 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                    }`}
                  >
                    {isConnecting ? (
                      <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Connecting</>
                    ) : isActive ? (
                      <><PhoneOff className="w-4 h-4 mr-1.5" /> End Call</>
                    ) : (
                      <><PhoneCall className="w-4 h-4 mr-1.5" /> Test Call</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
