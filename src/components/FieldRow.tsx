import { useState } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface FieldRowProps {
  label: string;
  value: string;
  displayValue?: string;
  type?: 'text' | 'number' | 'date';
  mono?: boolean;
  editable?: boolean;
  lowConfidence?: boolean;
  placeholder?: string;
  onSave?: (nextValue: string) => void;
}

export function FieldRow({
  label,
  value,
  displayValue,
  type = 'text',
  mono = false,
  editable = true,
  lowConfidence = false,
  placeholder = 'Not recorded',
  onSave,
}: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl transition-colors ${
        lowConfidence
          ? 'bg-amber-50/80 border border-amber-300'
          : 'border border-transparent hover:bg-slate-50'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          {lowConfidence && (
            <span className="text-[11px] font-medium text-amber-800">
              · Verify OCR
            </span>
          )}
        </div>

        {editing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
              autoFocus
              className={`w-full min-h-[44px] px-3 py-2 text-sm rounded-lg border border-teal-600 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 ${
                mono ? 'font-mono' : ''
              }`}
            />
            <button
              type="button"
              onClick={handleSave}
              aria-label={`Save ${label}`}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg bg-[#0F766E] text-white hover:bg-[#115E59] transition-colors shrink-0"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              aria-label={`Cancel editing ${label}`}
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p
            className={`mt-0.5 text-sm font-medium truncate ${
              value ? 'text-slate-900' : 'text-orange-700 italic'
            } ${mono ? 'font-mono tabular-nums' : 'tabular-nums'}`}
          >
            {displayValue || value || placeholder}
          </p>
        )}
      </div>

      {editable && !editing && onSave && (
        <button
          type="button"
          onClick={startEdit}
          aria-label={`Edit ${label}`}
          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-[#0F766E] hover:bg-teal-50 transition-colors shrink-0"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
