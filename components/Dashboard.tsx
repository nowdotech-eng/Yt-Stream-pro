import React, { useEffect, useRef } from 'react';
import { StreamStatus } from '../types';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import * as d3 from 'd3';
import { Activity, Server, Signal, Clock, Radio } from 'lucide-react';

interface DashboardProps {
  status: StreamStatus;
  onQuickStart: () => void;
}

// Mock data generator for the chart
const generateData = () => Array.from({ length: 20 }, (_, i) => ({
  time: i,
  bitrate: Math.floor(Math.random() * 2000) + 3000 // 3000-5000 kbps
}));

export const Dashboard: React.FC<DashboardProps> = ({ status, onQuickStart }) => {
  const gaugeRef = useRef<SVGSVGElement>(null);
  const data = generateData();

  // D3 Gauge Visualization for "System Health"
  useEffect(() => {
    if (!gaugeRef.current) return;
    
    const svg = d3.select(gaugeRef.current);
    svg.selectAll("*").remove();
    
    const width = 200;
    const height = 120;
    const radius = Math.min(width, height) - 10;
    
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${height - 20})`);
      
    const arc = d3.arc()
      .innerRadius(radius - 20)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);
      
    // Background Arc
    g.append("path")
      .datum({ endAngle: Math.PI / 2 })
      .style("fill", "#334155")
      .attr("d", arc as any);
      
    // Foreground Arc (Health)
    const healthAngle = (Math.PI * 0.8) - (Math.PI / 2); // 80% health
    
    const activeArc = d3.arc()
        .innerRadius(radius - 20)
        .outerRadius(radius)
        .startAngle(-Math.PI / 2)
        .endAngle(healthAngle);
        
    g.append("path")
      .style("fill", status.streaming ? "#22c55e" : "#64748b") // Green if streaming, slate if idle
      .attr("d", activeArc as any);
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -10)
      .text(status.streaming ? "GOOD" : "IDLE")
      .style("fill", "white")
      .style("font-weight", "bold");
      
  }, [status.streaming]);

  return (
    <div className="space-y-6">
      {/* Active Broadcast Banner */}
      {status.streaming && status.title && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-4">
              <div className="bg-primary/20 p-2 rounded-full">
                  <Radio className="h-6 w-6 text-primary" />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-foreground">Broadcasting Now</h2>
                  <p className="text-muted-foreground">{status.title}</p>
              </div>
          </div>
      )}

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Signal className={`h-5 w-5 ${status.streaming ? 'text-green-500' : 'text-muted-foreground'}`} />
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
             <span className={`text-2xl font-bold ${status.streaming ? 'text-green-500' : 'text-foreground'}`}>
                {status.streaming ? 'LIVE' : 'OFFLINE'}
             </span>
             {status.streaming && <span className="animate-pulse h-2 w-2 rounded-full bg-green-500"></span>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Uptime</h3>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {status.uptime || '0s'}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Bitrate (Est.)</h3>
          </div>
          <div className="mt-2 text-2xl font-bold">
            {status.streaming ? '3,420 Kbps' : '-'}
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-2 left-2 flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Health</span>
            </div>
            <svg ref={gaugeRef} width="200" height="120"></svg>
        </div>
      </div>

      {/* Main Chart */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
         <h3 className="mb-4 text-lg font-medium">Network Activity</h3>
         <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={status.streaming ? data : []}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Bar dataKey="bitrate" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            {!status.streaming && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Stream is offline
                </div>
            )}
         </div>
      </div>
      
      {!status.streaming && (
          <div className="flex justify-center py-8">
             <button 
                onClick={onQuickStart}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-lg shadow-lg transition-transform hover:scale-105 flex items-center gap-3"
             >
                <Signal className="h-6 w-6" />
                Start Broadcasting Now
             </button>
          </div>
      )}
    </div>
  );
};