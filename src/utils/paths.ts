const basePaths = ['auth.ts', 'auth.js', 'auth.server.js', 'auth.server.ts'];

export const possiblePaths = [
  ...basePaths,
  ...basePaths.map((it) => `lib/server/${it}`),
  ...basePaths.map((it) => `server/${it}`),
  ...basePaths.map((it) => `lib/${it}`),
  ...basePaths.map((it) => `utils/${it}`),
  ...basePaths.map((it) => `src/${it}`),
  ...basePaths.map((it) => `app/${it}`),
  ...basePaths.map((it) => `apps/${it}`),
];

