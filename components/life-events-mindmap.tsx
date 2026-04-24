"use client";

import { ChevronLeft, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  LIFE_EVENTS_CENTER,
  LIFE_EVENTS_CATEGORIES,
  type LifeEventCategoryId,
  type LifeEventMindNode
} from "@/lib/life-events-mindmap-data";

function HubButton({
  category,
  onOpen
}: {
  category: (typeof LIFE_EVENTS_CATEGORIES)[number];
  onOpen: (id: LifeEventCategoryId) => void;
}) {
  return (
    <button
      type="button"
      className={`life-mindmap-hub life-mindmap-hub-${category.tone}`}
      onClick={() => onOpen(category.id)}
    >
      <span className="life-mindmap-hub-label">{category.label}</span>
      <span className="life-mindmap-hub-sub">{category.subtitle}</span>
      <span className="life-mindmap-hub-count">{category.events.length} milestones</span>
    </button>
  );
}

function PanelHeader({
  eyebrow,
  title,
  icon
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
}) {
  return (
    <header className="panel-head">
      <div className="panel-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
    </header>
  );
}

export function LifeEventsMindmap() {
  const [categoryId, setCategoryId] = useState<LifeEventCategoryId | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);

  const category = useMemo(
    () => (categoryId ? LIFE_EVENTS_CATEGORIES.find((c) => c.id === categoryId) ?? null : null),
    [categoryId]
  );

  const selectedEvent: LifeEventMindNode | null = useMemo(() => {
    if (!category || !eventId) return null;
    return category.events.find((e) => e.id === eventId) ?? null;
  }, [category, eventId]);

  function openCategory(id: LifeEventCategoryId) {
    setCategoryId(id);
    setEventId(null);
  }

  function goRoot() {
    setCategoryId(null);
    setEventId(null);
  }

  function goCategoryOnly() {
    setEventId(null);
  }

  return (
    <article className="panel panel-large life-events-panel">
      <PanelHeader
        eyebrow="Reference map"
        title="Life events mindmap"
        icon={<Sparkles aria-hidden="true" size={20} />}
      />
      <p className="life-events-lede">
        {LIFE_EVENTS_CENTER.subtitle} Select a branch, then a milestone, to see planning checkpoints — informational only;
        not tax, legal, or investment advice.
      </p>

      <div className="life-mindmap">
        {(categoryId || eventId) && (
          <nav className="life-mindmap-breadcrumb" aria-label="Mindmap navigation">
            <button type="button" className="life-mindmap-crumb" onClick={goRoot}>
              {LIFE_EVENTS_CENTER.title}
            </button>
            {category ? (
              <>
                <span className="life-mindmap-crumb-sep" aria-hidden="true">
                  /
                </span>
                {selectedEvent ? (
                  <button type="button" className="life-mindmap-crumb" onClick={goCategoryOnly}>
                    {category.label}
                  </button>
                ) : (
                  <span className="life-mindmap-crumb-active">{category.label}</span>
                )}
              </>
            ) : null}
            {selectedEvent ? (
              <>
                <span className="life-mindmap-crumb-sep" aria-hidden="true">
                  /
                </span>
                <span className="life-mindmap-crumb-active">{selectedEvent.title}</span>
              </>
            ) : null}
          </nav>
        )}

        {!categoryId ? (
          <div className="life-mindmap-root" aria-label="Life event themes">
            <div className="life-mindmap-row-top">
              <HubButton
                category={LIFE_EVENTS_CATEGORIES.find((c) => c.id === "positive")!}
                onOpen={openCategory}
              />
              <div className="life-mindmap-center-wrap">
                <div className="life-mindmap-center" role="presentation">
                  <strong>{LIFE_EVENTS_CENTER.title}</strong>
                  <span>Average American arc</span>
                </div>
              </div>
              <HubButton
                category={LIFE_EVENTS_CATEGORIES.find((c) => c.id === "negative")!}
                onOpen={openCategory}
              />
            </div>
            <div className="life-mindmap-spoke-vertical" aria-hidden="true" />
            <div className="life-mindmap-row-bottom">
              <HubButton
                category={LIFE_EVENTS_CATEGORIES.find((c) => c.id === "neutral")!}
                onOpen={openCategory}
              />
            </div>
          </div>
        ) : (
          <div className="life-mindmap-drill">
            <div className="life-mindmap-events-col">
              <button type="button" className="life-mindmap-back" onClick={goRoot}>
                <ChevronLeft size={18} aria-hidden="true" />
                All themes
              </button>
              <h3 className="life-mindmap-events-title">{category?.label}</h3>
              <p className="life-mindmap-events-sub">{category?.subtitle}</p>
              <ul className="life-mindmap-event-list" role="list">
                {category?.events.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      className={`life-mindmap-event-chip ${eventId === ev.id ? "active" : ""}`}
                      onClick={() => setEventId(ev.id)}
                    >
                      {ev.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="life-mindmap-detail-col">
              {selectedEvent ? (
                <>
                  <h3 className="life-mindmap-detail-title">{selectedEvent.title}</h3>
                  <p className="life-mindmap-detail-eyebrow">Checklist</p>
                  <ul className="life-mindmap-checklist">
                    {selectedEvent.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="life-mindmap-detail-empty">
                  <p>Choose a milestone on the left to open its checklist.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
