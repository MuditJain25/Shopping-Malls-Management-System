import { Tag } from "lucide-react";

const fmt = (d) =>
  new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Renders a store's discount offers (description + date range); nothing if there are none.
export default function OfferList({ offers }) {
  if (!offers?.length) return null;
  return (
    <div className="mt-2 space-y-1">
      {offers.map((o) => (
        <div key={`${o.store_id}-${o.offer_id}`} className="badge bg-amber-100 text-amber-800 flex items-start gap-1 whitespace-normal">
          <Tag size={11} className="mt-0.5 shrink-0" />
          <span>
            {o.description}
            <span className="block text-[10px] opacity-75">{fmt(o.start_date)} – {fmt(o.end_date)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
