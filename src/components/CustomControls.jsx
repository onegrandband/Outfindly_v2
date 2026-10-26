import React, { useRef } from 'react';

/**
 * Custom modern slider replacement for raw HTML input[range].
 */
export function CustomSlider({ min = 0, max = 100, step = 1, value, onChange, label, unit = '' }) {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const trackRef = useRef(null);

  const handlePointerDown = (e) => {
    e.preventDefault();
    const updateFromPointer = (clientX) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawVal = min + pos * (max - min);
      const steppedVal = Math.round(rawVal / step) * step;
      const clampedVal = Number(Math.max(min, Math.min(max, steppedVal)).toFixed(2));
      onChange(clampedVal);
    };

    updateFromPointer(e.clientX);

    const onPointerMove = (moveEvent) => updateFromPointer(moveEvent.clientX);
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="w-full select-none">
      {label && (
        <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
          <span className="text-[#8b949e]">{label}</span>
          <span className="font-mono text-white bg-[#191B1D] px-1.5 py-0.5 rounded border border-[#2B2D2F]">
            {Math.round(value * 100)}{unit}
          </span>
        </div>
      )}

      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative h-2 w-full bg-[#121315] border border-[#2B2D2F] rounded-full cursor-pointer flex items-center py-2"
      >
        {/* Fill track */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-sky-600 rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Custom thumb */}
        <div
          className="absolute -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-sm border-2 border-sky-600 hover:scale-105 active:scale-95 transition-transform"
          style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Custom Switch / Checkbox replacement.
 */
export function CustomToggle({ checked, onChange, label, description }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full p-2 bg-[#121315] hover:bg-[#16181b] border border-[#2B2D2F] rounded-lg transition-colors cursor-pointer text-left"
    >
      <div className="min-w-0 pr-2">
        {label && <p className="text-xs font-semibold text-white">{label}</p>}
        {description && <p className="text-[10px] text-[#8b949e]">{description}</p>}
      </div>

      <div
        className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
          checked ? 'bg-[#00B06F]' : 'bg-[#2B2D2F]'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}
