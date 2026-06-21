"use client";

import { useState, useEffect } from "react";
import { Activity, PhoneCall, CheckCircle, TrendingUp, Users, Clock } from "lucide-react";

export default function Home() {
  const [statsData, setStatsData] = useState({ totalCalls: 0, concurrentCalls: 0, qualificationRate: '0%', avgDuration: '0m' });
  const [liveCampaigns, setLiveCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/stats')
      .then(res => res.json())
      .then(data => setStatsData(data))
      .catch(console.error);

    fetch('http://localhost:3001/api/calls')
      .then(res => res.json())
      .then(data => {
        setLiveCampaigns(data.slice(0, 5));
      })
      .catch(console.error);
  }, []);

  const stats = [
    { name: "Total Calls Today", value: statsData.totalCalls.toString(), change: "+14%", icon: PhoneCall, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Concurrent Calls", value: statsData.concurrentCalls.toString(), change: "+5%", icon: Activity, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { name: "Lead Qualification Rate", value: statsData.qualificationRate, change: "+2.1%", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Average Call Duration", value: statsData.avgDuration, change: "-12s", icon: Clock, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
        <p className="text-gray-400 mt-1">Real-time overview of your AI voice agents across all campaigns.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300 cursor-pointer group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 transition-all">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 mr-1" />
                <span className="text-sm font-medium text-emerald-400">{stat.change}</span>
                <span className="text-sm text-gray-500 ml-2">vs last week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Active Campaigns Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Agent Calls</h2>
          <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-sm font-medium text-gray-400">
                <th className="pb-3 px-4">Call ID</th>
                <th className="pb-3 px-4">Phone Number</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Duration</th>
                <th className="pb-3 px-4">Cost</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {liveCampaigns.map((call, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 font-mono text-gray-400 text-xs">{call.call_id}</td>
                  <td className="py-4 px-4 text-gray-300 flex items-center">
                    <PhoneCall className="w-4 h-4 mr-2 text-gray-500" />
                    {call.phone_number}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      call.status === 'Completed' || call.status === 'Qualified' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-amber-400/10 text-amber-400'
                    }`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{call.duration}</td>
                  <td className="py-4 px-4 text-gray-300 font-mono text-xs">{call.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
