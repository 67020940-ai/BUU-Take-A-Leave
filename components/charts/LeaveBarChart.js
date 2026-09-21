'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function LeaveBarChart({
  labels = [],
  datasets = [],
  yAxisLabel = 'จำนวน',
  height = 280,
  stacked = false,
  onBarClick = null,
  customTooltip = null,
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-neutral-50/50 dark:bg-slate-800/30 rounded-2xl animate-pulse text-xs text-neutral-400"
      >
        กำลังโหลดแผนภูมิ...
      </div>
    );
  }

  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: labels.length > 15 ? 24 : 42,
      ...ds,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, elements) => {
      if (onBarClick && elements && elements.length > 0) {
        const index = elements[0].index;
        onBarClick(index, labels[index]);
      }
    },
    onHover: (event, chartElement) => {
      if (onBarClick && event.native && event.native.target) {
        event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
      }
    },
    plugins: {
      legend: {
        display: datasets.length > 1,
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 12,
          font: {
            size: 11,
            weight: 'bold',
          },
          color: '#64748B',
        },
      },
      tooltip: {
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#E2E8F0',
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        displayColors: true,
        usePointStyle: true,
        callbacks: customTooltip?.callbacks || {
          label: function (context) {
            const label = context.dataset.label || '';
            const val = context.parsed.y !== null ? context.parsed.y : context.raw;
            return ` ${label ? label + ': ' : ''}${val} ${yAxisLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: labels.length > 20 ? 9 : 10,
            weight: '500',
          },
          color: '#64748B',
          maxRotation: 45,
          minRotation: 0,
          autoSkip: labels.length > 31,
        },
        border: {
          display: false,
        },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            size: 11,
          },
          color: '#94A3B8',
          callback: function (val) {
            if (Number.isInteger(val)) return val;
            return null;
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Bar data={data} options={options} />
    </div>
  );
}
