"use client";

import { useState, useEffect } from "react";
import { Upload, Play, Pause, PhoneOutgoing, CheckCircle2, AlertCircle } from "lucide-react";

export default function CampaignsPage() {
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/calls')
      .then(res => res.json())
      .then(data => setCalls(data))
      .catch(console.error);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Campaign Manager</h1>
          <p className="text-gray-400 mt-1">Upload leads and track live automated outbound calls.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white/10 text-white px-4 py-2 rounded-lg font-medium flex items-center hover:bg-white/20 transition-colors">
            <Upload className="w-5 h-5 mr-2" />
            Upload CSV
          </button>
          <button className="bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium flex items-center hover:bg-cyan-400 transition-colors">
            <PhoneOutgoing className="w-5 h-5 mr-2" />
            Start Campaign
          </button>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg font-semibold text-white">Call Detail Records (CDR)</h2>
          <div className="flex space-x-2">
            <button className="p-2 text-gray-400 hover:text-white bg-white/5 rounded-lg transition-colors"><Pause className="w-4 h-4" /></button>
            <button className="p-2 text-cyan-400 hover:text-cyan-300 bg-cyan-400/10 rounded-lg transition-colors"><Play className="w-4 h-4" /></button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-medium text-gray-400 uppercase tracking-wider bg-black/20">
                <th className="py-4 px-6">Call ID</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Date / Time</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Outcome</th>
                <th className="py-4 px-6">Cost</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {calls.map((call, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-6 font-mono text-gray-400 text-xs">{call.call_id}</td>
                  <td className="py-4 px-6 font-medium text-white">{call.phone_number}</td>
                  <td className="py-4 px-6 text-gray-400">{new Date(call.created_at).toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-300">{call.duration}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      call.status === 'Qualified' || call.status === 'Completed' ? 'bg-emerald-400/10 text-emerald-400' : 
                      call.status === 'Requires Follow-up' ? 'bg-amber-400/10 text-amber-400' :
                      'bg-gray-400/10 text-gray-400'
                    }`}>
                      {(call.status === 'Qualified' || call.status === 'Completed') && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {call.status === 'Requires Follow-up' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {call.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-400 font-mono text-xs">{call.cost}</td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => alert(call.transcript || 'No transcript available.')} className="text-cyan-400 hover:text-cyan-300 text-xs font-medium">View Transcript</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
