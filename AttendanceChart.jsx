import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AttendanceChart({ events = [] }) {
  const displayEvents = events.slice(0, 6);

  const labels = displayEvents.map(e => e.title.length > 20 ? `${e.title.substring(0, 18)}...` : e.title);
  const registeredData = displayEvents.map(e => e.registeredCount || 0);
  const capacityData = displayEvents.map(e => e.maxParticipants || 100);

  const data = {
    labels: labels.length ? labels : ['Workshop', 'Hackathon', 'Cultural Fest'],
    datasets: [
      {
        label: 'Registered Students',
        data: registeredData.length ? registeredData : [85, 164, 380],
        backgroundColor: 'rgba(79, 70, 229, 0.85)', // primary indigo
        borderRadius: 6
      },
      {
        label: 'Max Capacity',
        data: capacityData.length ? capacityData : [120, 200, 500],
        backgroundColor: 'rgba(203, 213, 225, 0.6)', // slate-300
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#1e1b4b',
        titleFont: { size: 12, family: 'Inter' },
        bodyFont: { size: 11, family: 'Inter' },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10 } }
      }
    }
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
