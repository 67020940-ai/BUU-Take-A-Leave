'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEFAULT_COLORS = [
  '#0284C7', // ลาป่วย (Sky-600)
  '#7749BC', // ลากิจส่วนตัว (Purple BUU)
  '#6366F1', // ลากิจกรรม (Indigo-500)
  '#F59E0B', // อื่น ๆ (Amber-500)
];

const HOVER_COLORS = [
  '#0369A1',
  '#5B21B6',
  '#4F46E5',
  '#D97706',
];

export default function LeaveDonutChart({
  labels = ['ลาป่วย', 'ลากิจส่วนตัว', 'ลากิจกรรม', 'อื่น ๆ'],
  dataValues = [0, 0, 0, 0],
  colors = DEFAULT_COLORS,
  hoverColors = HOVER_COLORS,
  unit = 'ครั้ง',
  height = 240,
  centerTitle = '',
  centerValue = '',
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const total = dataValues.reduce((acc, curr) => acc + (Number(curr) || 0), 0);

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

  // Handle empty state gracefully
  const displayValues = total === 0 ? [1] : dataValues;
  const displayColors = total === 0 ? ['#E2E8F0'] : colors;
  const displayHoverColors = total === 0 ? ['#CBD5E1'] : hoverColors;
  const displayLabels = total === 0 ? ['ยังไม่มีข้อมูล'] : labels;

  const data = {
    labels: displayLabels,
    datasets: [
      {
        data: displayValues,
        backgroundColor: displayColors,
        hoverBackgroundColor: displayHoverColors,
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        display: false, // We render a custom modern legend alongside
      },
      tooltip: {
        enabled: total > 0,
        backgroundColor: '#1E1B4B',
        titleColor: '#FFFFFF',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#E2E8F0',
        bodyFont: { size: 11 },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            const val = context.raw || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${context.label}: ${val} ${unit} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {/* Chart Canvas with Center Stat */}
      <div style={{ height, width: height }} className="relative flex items-center justify-center shrink-0">
        <Doughnut data={data} options={options} />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
            {centerValue !== '' ? centerValue : total}
          </span>
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
            {centerTitle || (unit === 'คน' ? 'นิสิตทั้งหมด' : 'รวมทั้งหมด')}
          </span>
        </div>
      </div>

      {/* Legend & Percentages */}
      <div className="flex-1 w-full space-y-2.5">
        {labels.map((lbl, idx) => {
          const val = dataValues[idx] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          const color = colors[idx % colors.length];

          return (
            <div
              key={lbl}
              className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50/70 dark:bg-slate-800/50 border border-neutral-200/50 dark:border-slate-700/50 hover:bg-neutral-100/70 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: color }}
                />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {lbl}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-neutral-600 dark:text-neutral-400 font-mono">
                  {val} <span className="text-[10px] text-neutral-400">{unit}</span>
                </span>
                <span
                  className="px-2 py-0.5 rounded-md font-bold text-[11px] text-white shadow-xs"
                  style={{ backgroundColor: color }}
                >
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
