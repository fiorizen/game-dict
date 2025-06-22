import type { Database } from "better-sqlite3";
import type { Category, NewCategory } from "../../shared/types.js";
export declare class CategoryModel {
    private db;
    constructor(db: Database);
    getAll(): Category[];
    getById(id: number): Category | null;
    create(category: NewCategory): Category;
    update(id: number, updates: Partial<NewCategory>): Category | null;
    delete(id: number): boolean;
    getByName(name: string): Category | null;
}
//# sourceMappingURL=category.d.ts.map