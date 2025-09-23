export interface EntityState<T extends { id: string }> {
  entities: Record<string, T>;
  ids: string[];
  loading: boolean;
  loadedAt: Date | null;
  error: string | null;
}

export function createEmptyEntityState<T extends { id: string }>(): EntityState<T> {
  return {
    entities: {},
    ids: [],
    loading: false,
    loadedAt: null,
    error: null,
  };
}

export function upsertMany<T extends { id: string }>(state: EntityState<T>, items: T[]): EntityState<T> {
  const entities = { ...state.entities } as Record<string, T>;
  const ids = new Set(state.ids);
  for (const item of items) {
    entities[item.id] = item;
    ids.add(item.id);
  }
  return { ...state, entities, ids: Array.from(ids), loadedAt: new Date() };
}

export function upsertOne<T extends { id: string }>(state: EntityState<T>, item: T): EntityState<T> {
  return upsertMany(state, [item]);
}

export function removeOne<T extends { id: string }>(state: EntityState<T>, id: string): EntityState<T> {
  const { [id]: _removed, ...rest } = state.entities;
  return { ...state, entities: rest as Record<string, T>, ids: state.ids.filter(x => x !== id) };
}


