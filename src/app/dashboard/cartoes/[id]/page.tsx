"use client";

import { CardDetailsPage } from "@/components/dashboard/card-details-page";
import { use } from "react";

export default function CardDetailsRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CardDetailsPage cardId={id} />;
}
