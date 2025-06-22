import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../schema.js";
import type { Category, NewCategory } from "../schema.js";
export declare class DrizzleCategoryModel {
    private db;
    constructor(db: BetterSQLite3Database<typeof schema>);
    getAll(): Category[];
    getById(id: number): Category | null;
    create(data: Omit<NewCategory, "id" | "createdAt" | "updatedAt">): Category;
    update(id: number, data: Partial<Omit<NewCategory, "id" | "createdAt">>): Category | null;
    delete(id: number): boolean;
    findByName(name: string): Category | null;
    count(): number;
}
//# sourceMappingURL=drizzle-category.d.ts.map