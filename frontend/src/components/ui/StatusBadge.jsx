import { STATUSES } from '../../constants';

export default function StatusBadge({ status }) {
  const s = STATUSES[status] || { label: '...', color: 'bg-slate-50' };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border ${s.color}`}>
      {s.label}
    </span>
  );
}