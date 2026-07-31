export type BookingStatus =
  | "DRAFT"
  | "AI_PROCESSING"
  | "READY_TO_BOOK"
  | "PENDING_BARBER_REVIEW"
  | "PENDING_CUSTOMER_CONFIRMATION"
  | "CONFIRMED"
  | "DECLINED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type ActorType = "client" | "barber" | "system" | "admin";

type Transition = {
  from: BookingStatus;
  to: BookingStatus;
  actors: ActorType[];
};

const TRANSITIONS: Transition[] = [
  { from: "DRAFT", to: "AI_PROCESSING", actors: ["client", "system"] },
  { from: "AI_PROCESSING", to: "READY_TO_BOOK", actors: ["system"] },
  { from: "AI_PROCESSING", to: "DRAFT", actors: ["system"] },
  { from: "DRAFT", to: "READY_TO_BOOK", actors: ["client"] },
  { from: "READY_TO_BOOK", to: "PENDING_BARBER_REVIEW", actors: ["client"] },
  {
    from: "PENDING_BARBER_REVIEW",
    to: "PENDING_CUSTOMER_CONFIRMATION",
    actors: ["barber", "admin"],
  },
  { from: "PENDING_BARBER_REVIEW", to: "REJECTED", actors: ["barber", "admin"] },
  { from: "PENDING_BARBER_REVIEW", to: "EXPIRED", actors: ["system"] },
  { from: "PENDING_BARBER_REVIEW", to: "CANCELLED", actors: ["admin", "client"] },
  { from: "PENDING_CUSTOMER_CONFIRMATION", to: "CONFIRMED", actors: ["client"] },
  { from: "PENDING_CUSTOMER_CONFIRMATION", to: "DECLINED", actors: ["client"] },
  { from: "PENDING_CUSTOMER_CONFIRMATION", to: "EXPIRED", actors: ["system"] },
  { from: "CONFIRMED", to: "CANCELLED", actors: ["admin"] },
];

export const BLOCKING_STATUSES: BookingStatus[] = [
  "PENDING_BARBER_REVIEW",
  "PENDING_CUSTOMER_CONFIRMATION",
  "CONFIRMED",
];

export function assertTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: ActorType,
): void {
  const ok = TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.actors.includes(actor),
  );
  if (!ok) {
    throw new Error(`Invalid transition ${from} -> ${to} by ${actor}`);
  }
}

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: ActorType,
): boolean {
  return TRANSITIONS.some(
    (t) => t.from === from && t.to === to && t.actors.includes(actor),
  );
}
