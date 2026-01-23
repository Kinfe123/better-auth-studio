export interface TsConfig {
    compilerOptions?: {
        paths?: Record<string, string[]>;
        baseUrl?: string;
        [key: string]: any;
    };
    references?: Array<{
        path: string;
    }>;
    [key: string]: any;
}
export declare function getTsconfigInfo(cwd?: string, tsconfigPath?: string): TsConfig;
//# sourceMappingURL=get-tsconfig-info.d.ts.map