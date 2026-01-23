import fs from "node:fs";
import path from "node:path";
export function getTsconfigInfo(cwd, tsconfigPath) {
    const configPath = tsconfigPath || path.join(cwd || process.cwd(), "tsconfig.json");
    if (!fs.existsSync(configPath)) {
        return {};
    }
    try {
        const content = fs.readFileSync(configPath, "utf-8");
        return JSON.parse(content);
    }
    catch (_error) {
        return {};
    }
}
//# sourceMappingURL=get-tsconfig-info.js.map