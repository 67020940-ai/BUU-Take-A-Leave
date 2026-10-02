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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    updateDark();
    window.addEventListener('theme-change', updateDark);
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      window.removeEventListener('theme-change', updateDark);
      observer.disconnect();
    };
  }, []);

  if (!isMounted) {
    return (
      <div
        style={{ height }}
        className="w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl animate-pulse text-xs text-slate-400"
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
            weight: '600',
          },
          color: isDark ? '#E2E8F0' : '#475569',
        },
      },
      tooltip: {
        backgroundColor: isDark ? '#0F172A' : '#1E293B',
        titleColor: '#FFFFFF',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#E2E8F0',
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        borderColor: isDark ? '#334155' : '#475569',
        borderWidth: 1,
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
          color: isDark ? '#94A3B8' : '#64748B',
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
          color: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          precision: 0,
          font: {
            size: 11,
          },
          color: isDark ? '#94A3B8' : '#94A3B8',
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
