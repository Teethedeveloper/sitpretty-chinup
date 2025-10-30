// src/components/Dashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as d3 from 'd3';
import { saveAs } from 'file-saver';
import type { SessionLog } from '../types/types';
import useTimer from '../hooks/useTimer';
import '../styles/global.scss';

interface PieData {
  label: string;
  value: number;
  color: string;
}

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SessionLog[]>(location.state?.logs || []);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { seconds } = useTimer(location.state?.duration || 300, () => {}, false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') params.append('type', typeFilter);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await fetch(`/api/posture/history?${params.toString()}`, {
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setLogs(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(`Failed to fetch session logs: ${errorMessage}`);
        console.error('Fetch logs error:', err);
      }
    };
    fetchLogs();
  }, [typeFilter, startDate, endDate]);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/posture/export', { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const csv = await response.text();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'posture_logs.csv');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to export logs: ${errorMessage}`);
      console.error('Export logs error:', err);
    }
  };

  const handleClearSession = async () => {
    try {
      const response = await fetch('/api/posture/session', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      setLogs([]);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to clear session: ${errorMessage}`);
      console.error('Clear session error:', err);
    }
  };

  const chartData = useMemo(() => {
    const good = logs.filter(log => !log.badPosture).length;
    const bad = logs.filter(log => log.badPosture).length;
    return [
      { label: 'Good Posture', value: good, color: '#4caf50' },
      { label: 'Bad Posture', value: bad, color: '#f44336' },
    ];
  }, [logs]);

  useEffect(() => {
    const svg = d3.select('#posture-chart');
    svg.selectAll('*').remove();
    const width = Math.min(400, window.innerWidth - 40);
    const height = width;
    const radius = width / 2;

    const arc = d3.arc<d3.PieArcDatum<PieData>>().innerRadius(0).outerRadius(radius);
    const pie = d3.pie<PieData>().value(d => d.value);
    const arcs = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${radius}, ${radius})`)
      .selectAll('arc')
      .data(pie(chartData))
      .enter()
      .append('g');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color);

    arcs
      .append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .text(d => (d.data.value > 0 ? `${d.data.label}: ${d.data.value}` : ''));
  }, [chartData]);

  return (
    <div className="dashboard">
      <header>
        <h1>SitPretty & ChinUp</h1>
        <button onClick={() => navigate('/')}>Back to Detector</button>
      </header>
      {error && <p className="error text-center">{error}</p>}
      <h2>Session Summary</h2>
      <p>Session Duration: {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}</p>
      <svg id="posture-chart"></svg>
      <div className="filters">
        <label>
          Type:
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="desk">Desk</option>
            <option value="squat">Squat</option>
          </select>
        </label>
        <label>
          Start Date:
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </label>
      </div>
      <div className="button-group">
        <button onClick={handleExport}>Export to CSV</button>
        <button onClick={handleClearSession}>Clear Session</button>
      </div>
      <h2>Logs</h2>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            {new Date(log.timestamp).toLocaleString()} - {log.type} - {log.badPosture ? 'Bad' : 'Good'} Posture
            {log.badPosture && ` (Reason: ${Object.keys(log.reason).filter(key => log.reason[key]).join(', ')})`}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Dashboard;
