import { createFileRoute } from "@tanstack/react-router";
import Catalog from "@/features/catalog/Catalog.tsx";

export const Route = createFileRoute("/catalog")({
  component: Catalog,
});
