import { useState, useEffect } from "react";

interface VibeCategory {
  slug: string;
  name: string;
  description: string;
}

interface VibeMeta {
  slug: string;
  name: string;
  category: string;
  description: string;
  archived: boolean;
}

export interface VibeEntry {
  name: string;
  category: string;
  archived: boolean;
}

export interface VibesMetadata {
  /** Map category slug → category display name */
  categoryName: Map<string, string>;
  /** Map category slug → category description */
  categoryDescription: Map<string, string>;
  /** Map vibe name → vibe description */
  vibeDescription: Map<string, string>;
  /** Map vibe name → archived status */
  vibeArchived: Map<string, boolean>;
  /** All vibes in config order */
  orderedVibes: VibeEntry[];
  /** Category slugs in config order */
  orderedCategories: string[];
}

const EMPTY: VibesMetadata = {
  categoryName: new Map(),
  categoryDescription: new Map(),
  vibeDescription: new Map(),
  vibeArchived: new Map(),
  orderedVibes: [],
  orderedCategories: [],
};

let cached: VibesMetadata | null = null;
let fetchPromise: Promise<VibesMetadata> | null = null;

async function fetchVibesMetadata(): Promise<VibesMetadata> {
  const res = await fetch("/api/vibes");
  if (!res.ok) return EMPTY;
  const json = await res.json();

  const categoryName = new Map<string, string>();
  const categoryDescription = new Map<string, string>();
  const vibeDescription = new Map<string, string>();
  const vibeArchived = new Map<string, boolean>();
  const orderedCategories: string[] = [];

  for (const cat of json.categories as VibeCategory[]) {
    categoryName.set(cat.slug, cat.name);
    categoryDescription.set(cat.slug, cat.description);
    orderedCategories.push(cat.slug);
  }

  const orderedVibes: VibeEntry[] = [];
  for (const v of (json.nodes ?? json.vibes) as VibeMeta[]) {
    vibeDescription.set(v.name, v.description);
    vibeArchived.set(v.name, v.archived);
    orderedVibes.push({ name: v.name, category: v.category, archived: v.archived });
  }

  return { categoryName, categoryDescription, vibeDescription, vibeArchived, orderedVibes, orderedCategories };
}

export function useVibesMetadata(): VibesMetadata {
  const [data, setData] = useState<VibesMetadata>(cached ?? EMPTY);

  useEffect(() => {
    if (cached) {
      setData(cached);
      return;
    }
    if (!fetchPromise) {
      fetchPromise = fetchVibesMetadata().then((result) => {
        cached = result;
        return result;
      });
    }
    fetchPromise.then(setData);
  }, []);

  return data;
}
