import { DbTheme } from "../db.types";

export type Theme = Omit<DbTheme, "path_id" | "modified_at"> & { id: string };
