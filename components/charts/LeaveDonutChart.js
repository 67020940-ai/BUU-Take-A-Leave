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
  onSelectCategory,
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

  const total = dataValues.reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  // Combine labels, values, and colors to sort descending clockwise (เรียงจากมากไปน้อยตามเข็มนาฬิกา)
  // ผูกสีประจำประเภทการลาไว้กับ label เสมอเพื่อคงความถูกต้องของสี
  const combinedData = labels.map((label, idx) => ({
    label,
    value: Number(dataValues[idx]) || 0,
    color: colors[idx % colors.length],
    hoverColor: hoverColors[idx % hoverColors.length],
  }));

  // เรียงลำดับจากค่าที่มากที่สุดไปน้อยที่สุด
  combinedData.sort((a, b) => b.value - a.value);

  const sortedLabels = combinedData.map((item) => item.label);
  const sortedValues = combinedData.map((item) => item.value);
  const sortedColors = combinedData.map((item) => item.color);
  const sortedHoverColors = combinedData.map((item) => item.hoverColor);

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

  // Handle empty state gracefully
  const displayValues = total === 0 ? [1] : sortedValues;
  const displayColors = total === 0 ? [isDark ? '#334155' : '#E2E8F0'] : sortedColors;
  const displayHoverColors = total === 0 ? [isDark ? '#475569' : '#CBD5E1'] : sortedHoverColors;
  const displayLabels = total === 0 ? ['ยังไม่มีข้อมูล'] : sortedLabels;

  const data = {
    labels: displayLabels,
    datasets: [
      {
        data: displayValues,
        backgroundColor: displayColors,
        hoverBackgroundColor: displayHoverColors,
        borderColor: isDark ? '#0F172A' : '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    onHover: (event, chartElement) => {
      if (event?.native?.target) {
        event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
      }
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0 && onSelectCategory) {
        const index = elements[0].index;
        const clickedLabel = displayLabels[index];
        if (clickedLabel && clickedLabel !== 'ยังไม่มีข้อมูล') {
          onSelectCategory(clickedLabel);
        }
      }
    },
    plugins: {
      legend: {
        display: false, // We render a custom modern legend alongside
      },
      tooltip: {
        enabled: total > 0,
        backgroundColor: isDark ? '#0F172A' : '#1E293B',
        titleColor: '#FFFFFF',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#E2E8F0',
        bodyFont: { size: 12, weight: '500' },
        padding: 12,
        cornerRadius: 12,
        boxPadding: 6,
        borderColor: isDark ? '#334155' : '#475569',
        borderWidth: 1,
        usePointStyle: true,
        callbacks: {
          title: function () {
            return '';
          },
          label: function (context) {
            const val = context.raw || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return ` ${context.label}: ${pct}% (${val} ${unit})`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col 2xl:flex-row items-center justify-center gap-4 sm:gap-6 w-full relative z-10 pointer-events-auto overflow-hidden">
      {/* Chart Canvas with Center Stat */}
      <div
        style={{ height, maxWidth: '100%' }}
        className="relative flex items-center justify-center shrink-0 aspect-square max-w-[200px] sm:max-w-[220px] w-full mx-auto cursor-pointer"
      >
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

      {/* Legend & Percentages - แสดงเฉพาะบนจอมือถือ/แท็บเล็ต (lg:hidden) และซ่อนบนคอมเพื่อให้ Clean ตามโจทย์ */}
      <div className="flex-1 w-full flex flex-col gap-2 min-w-0 lg:hidden">
        {sortedLabels.map((lbl, idx) => {
          const val = sortedValues[idx] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          const color = sortedColors[idx % sortedColors.length];

          return (
            <div
              key={lbl}
              onClick={() => onSelectCategory && onSelectCategory(lbl)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-neutral-50/70 dark:bg-slate-800/50 border border-neutral-200/50 dark:border-slate-700/50 hover:bg-purple-50/80 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-xs cursor-pointer active:scale-98 select-none relative z-10 shadow-2xs"
              title={`คลิกเพื่อดูรายละเอียดสัดส่วน ${lbl}`}
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
