import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withDocs } from "@farming-labs/next/config";

const appDir = dirname(fileURLToPath(import.meta.url));
const root = join(appDir, "../..");

export default withDocs({
  turbopack: {
    root,
  },
});
