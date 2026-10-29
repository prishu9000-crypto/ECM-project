import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function HoursDistributionChart({ categoryData }) {
  const defaultData = {
    'Technical Workshop': 45.5,
    'Hackathon': 72.0,
    'College Cultural Fest': 38.0,
    'NSS Community Service': 28.5,
    'Career Guidance': 16.0
  };

  const activeData = categoryData && Object.keys(categoryData).length > 0 ? categoryData : defaultData;

  const labels = Object.keys(activeData);
  const dataValues = Object.values(activeData);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#4f46e5', // indigo
          '#06b6d4', // cyan
          '#10b981', // emerald
          '#f59e0b', // amber
          '#8b5cf6'  // purple
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: { size: 10, family: 'Inter' },
          padding: 12
        }
      },
      tooltip: {
        backgroundColor: '#1e1b4b',
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} hrs`
        }
      }
    },
    cutout: '65%'
  };

  return (
    <div className="h-64 w-full flex items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
}
