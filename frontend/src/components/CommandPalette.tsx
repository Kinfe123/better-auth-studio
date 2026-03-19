import { Command } from "cmdk";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Database,
  Download,
  ExternalLink,
  Globe,
  Key,
  Lock,
  Mail,
  Moon,
  // Monitor,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Share2,
  Shield,
  Shuffle,
  Sun,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  category: string;
  keywords?: string[];
  requiresPlugin?: string;
  disabled?: boolean;
  disabledMessage?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [plugins, setPlugins] = useState<any>(null);

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const response = await fetch("/api/plugins");
        const data = await response.json();
        setPlugins(data);
      } catch (_error) {}
    };
    fetchPlugins();
  }, []);

  const isPluginEnabled = (pluginName: string) => {
    if (!plugins?.plugins) return false;
    return plugins.plugins.some((p: any) => p.id === pluginName);
  };

  const commands: CommandItem[] = [
    // ─── Navigation ───
    {
      id: "dashboard",
      title: "Dashboard",
      description: "View overview and statistics",
      icon: BarChart3,
      action: () => navigate("/"),
      category: "Navigation",
      keywords: ["overview", "stats", "home", "analytics"],
    },
    {
      id: "users",
      title: "Users",
      description: "Manage users and their accounts",
      icon: Users,
      action: () => navigate("/users"),
      category: "Navigation",
      keywords: ["user", "account", "profile", "members"],
    },
    {
      id: "organizations",
      title: "Organizations",
      description: "Manage organizations and teams",
      icon: Building2,
      action: () => navigate("/organizations"),
      category: "Navigation",
      keywords: ["org", "company", "team", "workspace"],
      requiresPlugin: "organization",
      disabled: !isPluginEnabled("organization"),
      disabledMessage: "Enable organization plugin in settings",
    },
    {
      id: "sessions",
      title: "Sessions",
      description: "View active user sessions",
      icon: Globe,
      action: () => navigate("/sessions"),
      category: "Navigation",
      keywords: ["session", "login", "active", "token"],
    },
    {
      id: "emails",
      title: "Emails",
      description: "View email templates",
      icon: Mail,
      action: () => navigate("/emails"),
      category: "Navigation",
      keywords: ["email", "template", "notification", "message"],
    },
    {
      id: "tools",
      title: "Tools",
      description: "View tools and utilities",
      icon: Wrench,
      action: () => navigate("/tools"),
      category: "Navigation",
      keywords: ["utilities", "tools", "helpers"],
    },
    {
      id: "database",
      title: "Database",
      description: "View database schema and tables",
      icon: Database,
      action: () => navigate("/database"),
      category: "Navigation",
      keywords: ["database", "schema", "tables", "models"],
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure Better Auth Studio",
      icon: Settings,
      action: () => navigate("/settings"),
      category: "Navigation",
      keywords: ["config", "setup", "preferences", "configuration"],
    },

    // ─── Actions ───
    {
      id: "create-user",
      title: "Create User",
      description: "Add a new user to the system",
      icon: UserPlus,
      action: () => navigate("/users", { state: { openModal: "create" } }),
      category: "Actions",
      keywords: ["add", "new", "register", "signup", "user"],
    },
    {
      id: "create-organization",
      title: "Create Organization",
      description: "Create a new organization",
      icon: Plus,
      action: () => navigate("/organizations", { state: { openModal: "create" } }),
      category: "Actions",
      keywords: ["add", "new", "org", "organization", "workspace"],
      requiresPlugin: "organization",
      disabled: !isPluginEnabled("organization"),
      disabledMessage: "Enable organization plugin in settings",
    },
    // {
    //   id: "create-session",
    //   title: "Create Session",
    //   description: "Create a new user session",
    //   icon: Monitor,
    //   action: () => navigate("/sessions", { state: { openModal: "create" } }),
    //   category: "Actions",
    //   keywords: ["add", "new", "session", "login"],
    // },
    {
      id: "seed-users",
      title: "Seed Users",
      description: "Generate sample users for testing",
      icon: Shuffle,
      action: () => navigate("/users", { state: { openModal: "seed" } }),
      category: "Actions",
      keywords: ["seed", "generate", "test", "sample", "fake", "dummy"],
    },
    {
      id: "seed-organizations",
      title: "Seed Organizations",
      description: "Generate sample organizations for testing",
      icon: Shuffle,
      action: () => navigate("/organizations", { state: { openModal: "seed" } }),
      category: "Actions",
      keywords: ["seed", "generate", "test", "sample", "fake", "dummy", "org"],
      requiresPlugin: "organization",
      disabled: !isPluginEnabled("organization"),
      disabledMessage: "Enable organization plugin in settings",
    },
    {
      id: "seed-sessions",
      title: "Seed Sessions",
      description: "Generate sample sessions for testing",
      icon: Shuffle,
      action: () => navigate("/sessions", { state: { openModal: "seed" } }),
      category: "Actions",
      keywords: ["seed", "generate", "test", "sample", "fake", "dummy", "session"],
    },
    {
      id: "export-analytics",
      title: "Export Analytics",
      description: "Generate shareable analytics image",
      icon: Share2,
      action: () => onAction?.("exportAnalytics"),
      category: "Actions",
      keywords: ["export", "share", "analytics", "screenshot", "image", "png"],
    },
    {
      id: "refresh-studio",
      title: "Refresh Studio",
      description: "Hard refresh the studio data",
      icon: RefreshCw,
      action: () => onAction?.("hardRefresh"),
      category: "Actions",
      keywords: ["refresh", "reload", "sync", "update"],
    },

    // ─── Appearance ───
    {
      id: "toggle-theme",
      title: "Toggle Theme",
      description: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
      icon: theme === "dark" ? Sun : Moon,
      action: () => toggleTheme(),
      category: "Appearance",
      keywords: ["theme", "appearance", "mode", "dark", "light", "toggle"],
    },

    // ─── Tools Quick Access ───
    {
      id: "tool-oauth",
      title: "OAuth Tester",
      description: "Test OAuth provider configuration",
      icon: Shield,
      action: () => navigate("/tools", { state: { openTool: "oauth" } }),
      category: "Tools",
      keywords: ["oauth", "provider", "google", "github", "social", "login"],
    },
    {
      id: "tool-jwt",
      title: "JWT Decoder",
      description: "Decode and inspect JWT tokens",
      icon: Key,
      action: () => navigate("/tools", { state: { openTool: "jwt" } }),
      category: "Tools",
      keywords: ["jwt", "token", "decode", "inspect", "bearer"],
    },
    {
      id: "tool-password",
      title: "Password Strength Checker",
      description: "Test password strength and security",
      icon: Lock,
      action: () => navigate("/tools", { state: { openTool: "password" } }),
      category: "Tools",
      keywords: ["password", "strength", "security", "hash"],
    },
    {
      id: "tool-secret",
      title: "Secret Generator",
      description: "Generate secure random secrets",
      icon: Key,
      action: () => navigate("/tools", { state: { openTool: "secret" } }),
      category: "Tools",
      keywords: ["secret", "generate", "random", "key", "token"],
    },
    {
      id: "tool-export",
      title: "Export Data",
      description: "Export users and data as JSON/CSV",
      icon: Download,
      action: () => navigate("/tools", { state: { openTool: "export" } }),
      category: "Tools",
      keywords: ["export", "download", "json", "csv", "data", "backup"],
    },

    // ─── Links ───
    {
      id: "open-docs",
      title: "Documentation",
      description: "Open Better Auth Studio documentation",
      icon: ExternalLink,
      action: () => window.open("https://better-auth-studio.vercel.app", "_blank"),
      category: "Links",
      keywords: ["docs", "documentation", "help", "guide", "reference"],
    },
    {
      id: "open-support",
      title: "Support",
      description: "Get help and support",
      icon: ExternalLink,
      action: () => window.open("https://better-auth-studio.vercel.app", "_blank"),
      category: "Links",
      keywords: ["support", "help", "contact", "bug", "issue"],
    },
  ];

  const filteredCommands = commands.filter((command) => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.description.toLowerCase().includes(searchLower) ||
      command.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower))
    );
  });

  const groupedCommands = filteredCommands.reduce(
    (acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "unset";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-black/90 overflow-hidden border border-white/10 rounded-none w-full max-w-2xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="p-2">
          <div className="flex items-center border-b border-dashed border-white/10 px-3 pb-3">
            <Search className="w-4 h-4 text-gray-400 mr-3" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search for actions, pages, or commands..."
              className="flex-1 placeholder:text-xs bg-transparent text-white placeholder-gray-400 outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-400 border border-dashed border-white/20 rounded-sm">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2">
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <Command.Group
                  key={category}
                  heading={category}
                  className="text-xs text-gray-400 font-medium mb-4 px-2"
                >
                  {categoryCommands.map((command) => {
                    const Icon = command.icon;
                    const isDisabled = command.disabled;

                    return (
                      <Command.Item
                        key={command.id}
                        value={command.id}
                        disabled={isDisabled}
                        onSelect={() => {
                          if (!isDisabled) {
                            command.action();
                            onClose();
                          }
                        }}
                        className={`flex items-center space-x-3 px-0 py-2 rounded-none transition-colors relative ${
                          isDisabled
                            ? "opacity-40 cursor-not-allowed blur-[0.5px]"
                            : "hover:bg-white/5 cursor-pointer"
                        }`}
                      >
                        <Icon className="w-4 h-4 text-white" />
                        <div className="flex-1">
                          <div className="text-white text-[13px] font-light flex items-center gap-2">
                            {command.title}
                            {isDisabled && <Lock className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <div className="text-[10px] font-light uppercase font-mono text-gray-400">
                            {isDisabled ? command.disabledMessage : command.description}
                          </div>
                        </div>
                        {!isDisabled && <ArrowRight className="w-4 h-4 text-gray-400" />}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))
            )}
          </Command.List>

          <div className="border-t border-dashed border-white/10 px-3 py-2 text-xs text-gray-400">
            <div className="flex items-center justify-between">
              <span>
                Press{" "}
                <kbd className="px-1 py-0.5 border border-dashed border-white/20 rounded-sm">
                  ↑↓
                </kbd>{" "}
                to navigate
              </span>
              <span>
                Press{" "}
                <kbd className="px-1 py-0.5 border border-dashed border-white/20 rounded-sm">
                  Enter
                </kbd>{" "}
                to select
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
