"use client"

import { KqlCard } from "@/components/kql-visuals"
import {
  dashboardCards,
  dashboardSections,
  dashboardTitle,
  visualPriorityOrder,
} from "@/lib/kql-dashboard"

function orderedCards() {
  const order = new Map(visualPriorityOrder.map((id, index) => [id, index]))
  return [...dashboardCards].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
}

export default function OperationalHealthPage() {
  const cards = orderedCards()

  return (
    <div className="space-y-12">
      <section className="bg-gradient-to-br from-slate-100 via-white to-teal-50 rounded-2xl border border-slate-200 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WRP Staging Environment</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-slate-900 mt-3">
              {dashboardTitle}
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl">
              Operational telemetry for WRP Staging only. The time picker overrides each card's default window for a unified
              view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <div className="bg-white/70 border border-slate-200 rounded-full px-4 py-2">Service reliability</div>
            <div className="bg-white/70 border border-slate-200 rounded-full px-4 py-2">Platform stability</div>
            <div className="bg-white/70 border border-slate-200 rounded-full px-4 py-2">App quality</div>
            <div className="bg-white/70 border border-slate-200 rounded-full px-4 py-2">Cost and ingestion</div>
          </div>
        </div>
      </section>

      {dashboardSections.map((section) => (
        <section key={section} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Section</p>
              <h3 className="text-2xl font-semibold text-gray-900 mt-2">{section}</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 grid-animate">
            {cards
              .filter((card) => card.section === section)
              .map((card) => (
                <KqlCard key={card.id} card={card} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
