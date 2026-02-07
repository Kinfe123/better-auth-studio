import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Calendar as CalendarIcon,
  Database,
  Download,
  Edit,
  Eye,
  Filter,
  HelpCircle,
  Loader,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  User,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { CopyableId } from "../components/CopyableId";
import { Check, Mail } from "../components/PixelIcons";
import { Terminal } from "../components/Terminal";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Pagination } from "../components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip-docs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useCounts } from "../contexts/CountsContext";
import { getImageSrc } from "../lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  lastSeenAt?: string | null;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
  role?: string;
}

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd MMM yyyy; HH:mm");
};

const formatTimeAgo = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
};

export default function Users() {
  const navigate = useNavigate();
  const { counts, refetchCounts } = useCounts();
  interface FilterConfig {
    type: string;
    value?: any;
    dateRange?: DateRange;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banExpiresIn, setBanExpiresIn] = useState<number | undefined>();
  const [adminPluginEnabled, setAdminPluginEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [editRole, setEditRole] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [seedRole, setSeedRole] = useState<string>("");
  const [createRole, setCreateRole] = useState<string>("");
  const lastSeenAtEnabled = !!(window as any).__STUDIO_CONFIG__?.lastSeenAt?.enabled;
  const lastSeenAtColumnName =
    (window as any).__STUDIO_CONFIG__?.lastSeenAt?.columnName || "lastSeenAt";
  const [seedingLogs, setSeedingLogs] = useState<
    Array<{
      id: string;
      type: "info" | "success" | "error" | "progress";
      message: string;
      timestamp: Date;
      status?: "pending" | "running" | "completed" | "failed";
    }>
  >([]);
  const [isSeeding, setIsSeeding] = useState(false);
  type UserSortColumn = "createdAt" | "lastSeenAt";
  const [userSortColumn, setUserSortColumn] = useState<UserSortColumn>("createdAt");
  const [userSortOrder, setUserSortOrder] = useState<"newest" | "oldest">("newest");

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users?limit=10000");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (_error) {
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAdminPlugin = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/status");
      const data = await response.json();
      setAdminPluginEnabled(data.enabled);
    } catch (_error) {
      setAdminPluginEnabled(false);
    }
  }, []);
  useEffect(() => {
    fetchUsers();
    checkAdminPlugin();

    const handleClickOutside = () => {
      if (actionMenuOpen) {
        setActionMenuOpen(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [actionMenuOpen, checkAdminPlugin, fetchUsers]);
  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showViewModal, selectedUser]);
  const handleSeedUsers = async (count: number, role?: string) => {
    setSeedingLogs([]);
    setIsSeeding(true);

    setSeedingLogs([
      {
        id: "start",
        type: "info",
        message: `Starting user seeding process for ${count} users...`,
        timestamp: new Date(),
      },
    ]);

    try {
      const response = await fetch("/api/seed/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, role: role || undefined }),
      });

      const result = await response.json();

      if (result.success) {
        const progressLogs = result.results.map((r: any, index: number) => {
          if (r.success) {
            return {
              id: `user-${index}`,
              type: "progress" as const,
              message: `Creating user: ${r.user.name} (${r.user.email})`,
              timestamp: new Date(),
              status: "completed" as const,
            };
          } else {
            return {
              id: `user-${index}`,
              type: "error" as const,
              message: `Failed to create user ${index + 1}: ${r.error}`,
              timestamp: new Date(),
            };
          }
        });

        setSeedingLogs((prev) => [...prev, ...progressLogs]);

        const successCount = result.results.filter((r: any) => r.success).length;
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: "complete",
            type: "success",
            message: `✅ Seeding completed! Created ${successCount}/${count} users successfully`,
            timestamp: new Date(),
          },
        ]);

        await fetchUsers();
        await refetchCounts();
      } else {
        setSeedingLogs((prev) => [
          ...prev,
          {
            id: "error",
            type: "error",
            message: `❌ Seeding failed: ${result.error || "Unknown error"}`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setSeedingLogs((prev) => [
        ...prev,
        {
          id: "error",
          type: "error",
          message: `❌ Network error: ${error}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSeeding(false);
    }
  };

  const openViewModal = (user: User) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role || "");
    setImagePreview(user.image || null);
    setSelectedImageFile(null);
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCreateUser = async () => {
    const name = (document.getElementById("create-name") as HTMLInputElement)?.value;
    const email = (document.getElementById("create-email") as HTMLInputElement)?.value;
    const password = (document.getElementById("create-password") as HTMLInputElement)?.value;

    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsCreating(true);
    const toastId = toast.loading("Creating user...");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: createRole || null }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        setShowCreateModal(false);
        setCreateRole("");
        (document.getElementById("create-name") as HTMLInputElement).value = "";
        (document.getElementById("create-email") as HTMLInputElement).value = "";
        (document.getElementById("create-password") as HTMLInputElement).value = "";
        toast.success("User created successfully!", { id: toastId });
      } else {
        toast.error(`Error creating user: ${result.error || "Unknown error"}`, { id: toastId });
      }
    } catch (_error) {
      toast.error("Error creating user", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const compressImage = (
    file: File,
    maxWidth: number = 800,
    maxHeight: number = 800,
    quality: number = 0.8,
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality,
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      try {
        // Compress image before converting to base64
        const compressedFile = await compressImage(file);
        setSelectedImageFile(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        toast.error("Failed to process image");
        console.error("Image compression error:", error);
      }
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    const name = (document.getElementById("edit-name") as HTMLInputElement)?.value;
    const email = (document.getElementById("edit-email") as HTMLInputElement)?.value;

    if (!name || !email) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsUpdating(true);
    const toastId = toast.loading("Updating user...");

    try {
      const updateData: any = { name, email, role: editRole || null };

      if (selectedImageFile) {
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.startsWith("data:image/")) {
              resolve(result);
            } else {
              reject(new Error("Invalid image data"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedImageFile);
        });
        updateData.image = imageData; // Store as base64 data URL
      } else if (imagePreview === null && selectedUser.image) {
        updateData.image = null;
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        setShowEditModal(false);
        setSelectedUser(null);
        setEditRole("");
        setImagePreview(null);
        setSelectedImageFile(null);
        toast.success("User updated successfully!", { id: toastId });
      } else {
        toast.error(`Error updating user: ${result.error || "Unknown error"}`, { id: toastId });
      }
    } catch (_error) {
      toast.error("Error updating user", { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting user...");

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (result.success) {
        await fetchUsers();
        await refetchCounts();
        setShowDeleteModal(false);
        setSelectedUser(null);
        toast.success("User deleted successfully!", { id: toastId });
      } else {
        toast.error(`Error deleting user: ${result.error || "Unknown error"}`, { id: toastId });
      }
    } catch (_error) {
      toast.error("Error deleting user", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser) return;

    if (!adminPluginEnabled) {
      toast.error("Admin plugin is not enabled");
      return;
    }

    setIsBanning(true);
    const toastId = toast.loading("Banning user...");
    try {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          banReason: banReason || "No reason provided",
          banExpiresIn: banExpiresIn,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("User banned successfully!", { id: toastId });
        setShowBanModal(false);
        setBanReason("");
        setBanExpiresIn(undefined);
        setSelectedUser(null);
        setActionMenuOpen(null);
        fetchUsers();
      } else {
        toast.error(`Error banning user: ${result.error || result.message || "Unknown error"}`, {
          id: toastId,
        });
      }
    } catch (_error) {
      toast.error("Error banning user", { id: toastId });
    } finally {
      setIsBanning(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!selectedUser) return;

    if (!adminPluginEnabled) {
      toast.error("Admin plugin is not enabled");
      return;
    }

    setIsUnbanning(true);
    const toastId = toast.loading("Unbanning user...");
    try {
      const response = await fetch("/api/admin/unban-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });
      const result = await response.json();

      if (response.ok) {
        toast.success("User unbanned successfully!", { id: toastId });
        setShowUnbanModal(false);
        setSelectedUser(null);
        setActionMenuOpen(null);
        fetchUsers();
      } else {
        toast.error(`Error unbanning user: ${result.error || result.message || "Unknown error"}`, {
          id: toastId,
        });
      }
    } catch (_error) {
      toast.error("Error unbanning user", { id: toastId });
    } finally {
      setIsUnbanning(false);
    }
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      toast.error("No users to export");
      return;
    }

    const csvHeaders = ["ID", "Name", "Email", "Email Verified", "Created At", "Updated At"];
    const csvData = users.map((user) => [
      user.id,
      user.name || "",
      user.email || "",
      !!user.emailVerified,
      new Date(user.createdAt).toLocaleString(),
      new Date(user.updatedAt).toLocaleString(),
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvData.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${users.length} users to CSV`);
  };

  const addFilter = (filterType: string) => {
    const exists = activeFilters.some((f) => f.type === filterType);
    if (!exists) {
      setActiveFilters((prev) => [...prev, { type: filterType }]);
      setCurrentPage(1);
    }
  };

  const removeFilter = (filterType: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.type !== filterType));
    setCurrentPage(1);
  };

  const updateFilterValue = (filterType: string, value: any) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, value } : f)));
  };

  const updateFilterDateRange = (filterType: string, dateRange?: DateRange) => {
    setActiveFilters((prev) => prev.map((f) => (f.type === filterType ? { ...f, dateRange } : f)));
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilters.length === 0) {
      return matchesSearch;
    }

    const matchesFilters = activeFilters.every((filter) => {
      switch (filter.type) {
        case "emailVerified":
          if (filter.value === undefined) return true;
          return user.emailVerified === (filter.value === "true");
        case "banned":
          if (filter.value === undefined) return true;
          return user.banned === (filter.value === "true");
        case "active":
          return user.banned !== true;
        case "createdAt": {
          if (!filter.dateRange?.from && !filter.dateRange?.to) return true;
          const userDate = new Date(user.createdAt);
          if (filter.dateRange?.from && filter.dateRange.from > userDate) return false;
          if (filter.dateRange?.to && filter.dateRange.to < userDate) return false;
          return true;
        }
        case "role":
          if (!filter.value) return true;
          return user.role?.toLowerCase().includes(filter.value.toLowerCase());
        default:
          return true;
      }
    });

    return matchesSearch && matchesFilters;
  });

  const bannedCount = users.filter((u) => u.banned).length;

  const sortedUsers = useMemo(() => {
    const list = [...filteredUsers];
    list.sort((a, b) => {
      const getCreatedAt = (u: User) => new Date(u.createdAt).getTime();
      const getLastSeenAt = (u: User) => {
        const v = u.lastSeenAt ?? (u as any)[lastSeenAtColumnName];
        return v ? new Date(v).getTime() : 0;
      };
      const aVal = userSortColumn === "createdAt" ? getCreatedAt(a) : getLastSeenAt(a);
      const bVal = userSortColumn === "createdAt" ? getCreatedAt(b) : getLastSeenAt(b);
      if (userSortColumn === "lastSeenAt") {
        const aHas = a.lastSeenAt ?? (a as any)[lastSeenAtColumnName];
        const bHas = b.lastSeenAt ?? (b as any)[lastSeenAtColumnName];
        if (!aHas && !bHas) return 0;
        if (!aHas) return 1;
        if (!bHas) return -1;
      }
      return userSortOrder === "newest" ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [filteredUsers, userSortColumn, userSortOrder, lastSeenAtColumnName]);

  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = sortedUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center h-full">
        <div className="flex flex-col items-center space-y-3">
          <Loader className="w-6 h-6 text-white animate-spin" />
          <div className="text-white text-sm">Loading users...</div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl relative text-white font-light inline-flex items-start">
            Users
            <sup className="text-xs text-gray-500 ml-1 mt-0 inline-flex items-baseline">
              <AnimatedNumber
                value={counts.users ?? 0}
                className="text-white font-mono text-sm"
                prefix={<span className="mr-1 text-gray-500">[</span>}
                suffix={<span className="ml-1 text-gray-500">]</span>}
                format={{ notation: "standard", maximumFractionDigits: 0 }}
              />
            </sup>
          </h1>
          <p className="text-gray-400 font-light text-sm mt-1 uppercase font-mono">
            Manage your application users
          </p>
          <div className="flex items-center space-x-4 mt-2">
            {bannedCount > 0 && (
              <span className="text-sm text-red-400 flex items-center space-x-1">
                <Ban className="w-3 h-3" />
                <span>{bannedCount} Banned</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
            onClick={exportUsersToCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
            onClick={() => setShowSeedModal(true)}
          >
            <Database className="w-4 h-4 mr-2" />
            Seed
          </Button>
          <Button
            className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none"
            onClick={() => setShowCreateModal(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Select value="" onValueChange={addFilter}>
              <SelectTrigger className="w-[180px]">
                <div className="flex mr-3 items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Filter</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {!activeFilters.some((f) => f.type === "emailVerified") && (
                  <SelectItem value="emailVerified">Email Verified</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === "banned") && (
                  <SelectItem value="banned">Banned Status</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === "createdAt") && (
                  <SelectItem value="createdAt">Created Date</SelectItem>
                )}
                {!activeFilters.some((f) => f.type === "role") && (
                  <SelectItem value="role">Role</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button onClick={() => setActiveFilters([])} className="">
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              {activeFilters.map((filter) => (
                <div
                  key={filter.type}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-sm"
                >
                  <Filter className="w-3 h-3 text-white" />

                  {filter.type === "emailVerified" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Email Verified:</span>
                      <Select
                        value={filter.value || ""}
                        onValueChange={(val) => updateFilterValue("emailVerified", val)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span>
                            {filter.value === "true"
                              ? "True"
                              : filter.value === "false"
                                ? "False"
                                : "Select"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">True</SelectItem>
                          <SelectItem value="false">False</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {filter.type === "banned" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Banned:</span>
                      <Select
                        value={filter.value || ""}
                        onValueChange={(val) => updateFilterValue("banned", val)}
                      >
                        <SelectTrigger className="h-7 w-24 text-xs">
                          <span>
                            {filter.value === "true"
                              ? "Yes"
                              : filter.value === "false"
                                ? "No"
                                : "Select"}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {filter.type === "createdAt" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Created:</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filter.dateRange?.from
                              ? format(filter.dateRange.from, "MMM dd yyyy")
                              : "From"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-black border-white/10">
                          <Calendar
                            mode="single"
                            selected={filter.dateRange?.from}
                            onSelect={(date) =>
                              updateFilterDateRange("createdAt", {
                                from: date,
                                to: filter.dateRange?.to,
                              })
                            }
                            initialFocus
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-8 px-3 text-xs font-mono uppercase text-gray-400 hover:text-white bg-transparent border-white/10 hover:bg-white/5"
                          >
                            <CalendarIcon className="mr-1 h-3 w-3" />
                            {filter.dateRange?.to
                              ? format(filter.dateRange.to, "MMM dd yyyy")
                              : "To"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-black border-white/10">
                          <Calendar
                            mode="single"
                            selected={filter.dateRange?.to}
                            onSelect={(date) =>
                              updateFilterDateRange("createdAt", {
                                from: filter.dateRange?.from,
                                to: date,
                              })
                            }
                            initialFocus
                            disabled={(date) =>
                              filter.dateRange?.from ? date < filter.dateRange.from : false
                            }
                            className="rounded-none"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {filter.type === "role" && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">Role:</span>
                      <Input
                        type="text"
                        value={filter.value || ""}
                        onChange={(e) => updateFilterValue("role", e.target.value)}
                        className="h-7 w-32 text-xs bg-black border-white/20 text-white"
                        placeholder="Enter role..."
                      />
                    </div>
                  )}

                  <button
                    onClick={() => removeFilter(filter.type)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-black/30 border border-dashed border-white/20 rounded-none">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dashed border-white/10">
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">User</th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                  Email Status
                </th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">Role</th>
                <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUserSortColumn("createdAt");
                      setUserSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
                    }}
                    className="flex items-center gap-1.5 font-mono uppercase hover:text-white/90 transition-colors"
                  >
                    Created
                    {userSortColumn === "createdAt" ? (
                      userSortOrder === "newest" ? (
                        <ArrowDown className="w-3.5 h-3.5 text-white/70" />
                      ) : (
                        <ArrowUp className="w-3.5 h-3.5 text-white/70" />
                      )
                    ) : null}
                  </button>
                </th>
                {lastSeenAtEnabled && (
                  <th className="text-left py-4 px-4 text-white font-mono uppercase text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUserSortColumn("lastSeenAt");
                        setUserSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
                      }}
                      className="flex items-center gap-1.5 font-mono uppercase hover:text-white/90 transition-colors"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        Last seen
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className="inline-flex text-white/50 hover:text-white/80 cursor-help"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="max-w-xs lowercase border border-white/20 bg-black/95 text-white text-xs font-normal shadow-xl rounded-none px-3 py-2"
                            >
                              Last seen is last time the user was active.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </span>
                      {userSortColumn === "lastSeenAt" ? (
                        userSortOrder === "newest" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-white/70" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-white/70" />
                        )
                      ) : null}
                    </button>
                  </th>
                )}
                <th className="text-right py-4 px-4 text-white font-mono uppercase text-xs">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan={lastSeenAtEnabled ? 6 : 5} className="py-12 px-4 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-none border border-dashed border-white/20 bg-white/10 flex items-center justify-center">
                        <UsersIcon className="w-8 h-8 text-white/50" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium text-lg">No users found</h3>
                        <p className="text-gray-400 text-sm mt-1">
                          {searchTerm || activeFilters.length > 0
                            ? "Try adjusting your search or filter criteria"
                            : "Get started by creating your first user or seeding some data"}
                        </p>
                      </div>
                      {!searchTerm && activeFilters.length === 0 && (
                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-white text-black hover:bg-gray-200 rounded-none"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Create User
                          </Button>
                          <Button
                            onClick={() => setShowSeedModal(true)}
                            className="border border-dashed border-white/20 text-white hover:bg-white/10 bg-transparent rounded-none"
                          >
                            <Database className="w-4 h-4 mr-2" />
                            Seed Data
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-b border-dashed hover:bg-white/5 cursor-pointer ${
                      user.banned ? "border-red-500/30 bg-red-500/5" : "border-white/5"
                    }`}
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={getImageSrc(
                              user.image,
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
                            )}
                            alt={user.name}
                            className={`w-10 h-10 rounded-none border border-dashed object-cover ${
                              user.banned ? "border-red-400/50 opacity-60" : "border-white/20"
                            }`}
                            onError={(e) => {
                              // Fallback to default avatar if image fails to load
                              (e.target as HTMLImageElement).src =
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`;
                            }}
                          />
                          {user.banned && (
                            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5">
                              <Ban className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="text-white font-light">{user.name}</div>
                            {user.banned && (
                              <span className="relative group inline-block">
                                <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 border border-red-500/50 text-red-400 rounded-sm uppercase tracking-wide cursor-help">
                                  Banned
                                </span>
                                {user.banReason && (
                                  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2 py-1 text-[10px] font-mono text-gray-300 bg-black border border-dashed border-white/20 rounded-none whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50">
                                    {user.banReason}
                                    <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-white/20"></span>
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400 mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {user.emailVerified ? (
                          <Check className="w-4 h-4 text-green-400/60" />
                        ) : (
                          <Mail className="w-4 h-4 text-yellow-400/60" />
                        )}
                        <span className="text-sm text-gray-400">
                          {user.emailVerified ? "Verified" : "Not Verified"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {user.role ? (
                        <span className="px-2 py-1 text-xs font-mono uppercase bg-white/5 border border-dashed border-white/15 text-white/80 rounded-sm tracking-wide">
                          {user.role}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-400">
                      <div className="flex uppercase font-mono flex-col text-xs">
                        <span>{format(new Date(user.createdAt), "dd MMM yyyy, HH:mm")}</span>
                        <p className="text-xs text-gray-500">{formatTimeAgo(user.createdAt)}</p>
                      </div>
                    </td>
                    {lastSeenAtEnabled && (
                      <td className="py-4 px-4 text-sm text-gray-400">
                        {(() => {
                          const lastSeen = user.lastSeenAt ?? (user as any)[lastSeenAtColumnName];
                          return lastSeen ? (
                            <div className="flex uppercase font-mono text-xs flex-col">
                              <span>{format(new Date(lastSeen), "dd MMM yyyy, HH:mm")}</span>
                              <p className="text-xs text-gray-500">{formatTimeAgo(lastSeen)}</p>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          );
                        })()}
                      </td>
                    )}
                    <td className="py-4 px-4 text-right">
                      <div className="relative flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white rounded-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuOpen(actionMenuOpen === user.id ? null : user.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>

                        {actionMenuOpen === user.id && (
                          <div
                            className="absolute z-[999] right-0 top-full mt-1 w-48 bg-black border border-white/20 rounded-none shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="w-full px-4 py-2 text-left text-[11px] border-b border-dashed border-white/20 text-white/70 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(null);
                                openViewModal(user);
                              }}
                            >
                              <span>View</span>
                              <Eye className="w-3 h-3 text-white/10 group-hover:text-white/70 transition-colors" />
                            </button>
                            <button
                              className="w-full px-4 py-2 text-left text-[11px] border-b border-dashed border-white/20 text-white/70 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(null);
                                openEditModal(user);
                              }}
                            >
                              <span>Edit User</span>
                              <Edit className="w-3 h-3 text-white/10 group-hover:text-white/70 transition-colors" />
                            </button>
                            {adminPluginEnabled &&
                              (user.banned ? (
                                <button
                                  className="w-full px-4 py-2 text-left text-[11px] text-green-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowUnbanModal(true);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  <span>Unban User</span>
                                  <Ban className="w-3 h-3 text-green-400/10 group-hover:text-green-400/70 transition-colors" />
                                </button>
                              ) : (
                                <button
                                  className="w-full px-4 py-2 text-left text-[11px] text-yellow-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowBanModal(true);
                                    setActionMenuOpen(null);
                                  }}
                                >
                                  <span>Ban User</span>
                                  <Ban className="w-3 h-3 text-yellow-400/10 group-hover:text-yellow-400/70 transition-colors" />
                                </button>
                              ))}
                            <div className="flex flex-col items-center justify-center">
                              <hr className="w-[calc(100%)] border-white/10 h-px" />
                              <div className="relative z-20 h-2 w-[calc(100%)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
                              <hr className="w-[calc(100%)] border-white/10 h-px" />
                            </div>
                            <button
                              className="w-full px-4 py-2 text-left text-[11px] text-red-400 hover:bg-white/10 flex items-center justify-between font-mono uppercase tracking-tight group"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(null);
                                openDeleteModal(user);
                              }}
                            >
                              <span>Delete User</span>
                              <Trash2 className="w-3 h-3 text-red-400/30 group-hover:text-red-400/70 transition-colors" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={sortedUsers.length}
          startIndex={startIndex}
          endIndex={endIndex}
        />
      </div>

      {/* Seed Modal */}
      {showSeedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="overflow-x-hidden bg-black/90 border border-white/10 p-6 w-full pt-4 max-w-2xl rounded-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm text-white flex items-center justify-center font-light uppercase">
                <span className="text-white/50 mr-2">[</span>
                <UsersIcon className="inline mr-2 w-3 h-3 text-white" />
                <span className="font-mono text-white/70 uppercase">Seed User</span>
                <span className="text-white/50 ml-2">]</span>
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSeedModal(false);
                  setSeedRole("");
                }}
                className="text-gray-400 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <hr className="border-white/10 -mx-10 border-dashed -mt-4 mb-4" />
            <div className="space-y-6">
              {/* User Seeding */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {/* <h4 className="text-white font-light">Seed Users</h4> */}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label htmlFor="user-count" className="text-sm text-gray-400 font-light">
                        Number of users
                      </Label>
                      <Input
                        id="user-count"
                        type="number"
                        min="1"
                        max="100"
                        defaultValue="5"
                        className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="seed-role" className="text-sm text-gray-400 font-light">
                      Role (optional)
                    </Label>
                    <Select
                      className="bg-black text-white"
                      value={seedRole}
                      onValueChange={setSeedRole}
                    >
                      <SelectTrigger
                        id="seed-role"
                        className="mt-1 border border-dashed border-white/20 bg-black text-white rounded-none"
                      >
                        <SelectValue placeholder="Select role (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="mix">Mix (Random)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const count = parseInt(
                        (document.getElementById("user-count") as HTMLInputElement)?.value || "5",
                        10,
                      );
                      handleSeedUsers(count, seedRole || undefined);
                    }}
                    disabled={isSeeding}
                    className="bg-transparent hover:bg-white/90 bg-white text-black border border-white/20 rounded-none mt-6 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <>
                        <Loader className="w-3 h-3 mr-2 animate-spin" />
                        Seeding...
                      </>
                    ) : (
                      <>
                        <Database className="w-3 h-3 mr-2" />
                        Seed Users
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {seedingLogs.length > 0 && (
                <div className="mt-6">
                  <Terminal
                    title="User Seeding Terminal"
                    lines={seedingLogs}
                    isRunning={isSeeding}
                    className="w-full"
                    defaultCollapsed={true}
                  />
                </div>
              )}
            </div>
            <hr className="border-white/10 -mx-10 border-dashed mt-10" />
            <div className="flex justify-end mt-6 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSeedModal(false);
                  setSeedRole("");
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Create User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateRole("");
                }}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="create-name" className="text-xs text-white/80 font-mono uppercase">
                  Name
                </Label>
                <Input
                  id="create-name"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-email" className="text-xs text-white/80 font-mono uppercase">
                  Email
                </Label>
                <Input
                  id="create-email"
                  type="email"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label
                  htmlFor="create-password"
                  className="text-xs text-white/80 font-mono uppercase"
                >
                  Password
                </Label>
                <Input
                  id="create-password"
                  type="password"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="create-role" className="text-xs text-white/80 font-mono uppercase">
                  Role
                </Label>
                <Select value={createRole} onValueChange={setCreateRole}>
                  <SelectTrigger
                    id="create-role"
                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateRole("");
                }}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isCreating}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 p-6 w-full max-w-lg rounded-none shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Edit User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole("");
                  setImagePreview(null);
                  setSelectedImageFile(null);
                }}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt={selectedUser.name}
                        className="w-14 h-14 object-cover"
                      />
                    ) : (
                      <User className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <label
                    htmlFor="image-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-none"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </label>
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setImagePreview(null);
                        setSelectedImageFile(null);
                      }}
                      disabled={isUpdating}
                      className="absolute bottom-0 right-0 w-4 h-4 bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    disabled={isUpdating}
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <CopyableId id={selectedUser.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                  {selectedImageFile && (
                    <div className="text-xs -mt-1 text-gray-500 font-mono">New image selected</div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-name" className="text-xs text-white/80 font-mono uppercase">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  defaultValue={selectedUser.name}
                  placeholder="e.g. John Doe"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-email" className="text-xs text-white/80 font-mono uppercase">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={selectedUser.email}
                  placeholder="e.g. john@example.com"
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="edit-role" className="text-xs text-white/80 font-mono uppercase">
                  Role
                </Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger
                    id="edit-role"
                    className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditRole("");
                  setImagePreview(null);
                  setSelectedImageFile(null);
                }}
                disabled={isUpdating}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="bg-white hover:bg-white/90 text-black border border-white/20 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Delete User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="w-14 h-14 object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <CopyableId id={selectedUser.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg text-white font-light uppercase font-mono">User Details</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    selectedUser.image ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`
                  }
                  alt={selectedUser.name}
                  className="w-14 h-14 rounded-none border border-dashed border-white/15"
                />
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <CopyableId id={selectedUser.id} variant="subscript" nonSliced />
                  </div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  { label: "Email Verified", value: selectedUser.emailVerified ? "Yes" : "No" },
                  { label: "Role", value: selectedUser.role || "—" },
                  { label: "Banned", value: selectedUser.banned ? "Yes" : "No" },
                  { label: "Ban Reason", value: selectedUser.banReason || "—" },
                  { label: "Ban Expires", value: formatDateTime(selectedUser.banExpires) },
                  { label: "Created", value: formatDateTime(selectedUser.createdAt) },
                  { label: "Updated", value: formatDateTime(selectedUser.updatedAt) },
                  ...(lastSeenAtEnabled
                    ? [
                        {
                          label: "Last seen",
                          value: (() => {
                            const lastSeen =
                              selectedUser.lastSeenAt ??
                              (selectedUser as any)[lastSeenAtColumnName];
                            return lastSeen ? (
                              <span className="block text-right max-w-[60%]">
                                <span className="block text-[10px] font-mono uppercase text-white">
                                  {formatDateTime(lastSeen)}
                                </span>
                                <span className="block text-[9px] font-mono text-gray-500 mt-0.5">
                                  {formatTimeAgo(lastSeen)}
                                </span>
                              </span>
                            ) : (
                              "—"
                            );
                          })(),
                        },
                      ]
                    : []),
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border border-dashed border-white/15 bg-black/90 px-3 py-2 rounded-none"
                  >
                    <div className="text-[11px] font-mono font-light uppercase tracking-wide text-gray-400">
                      {item.label}
                    </div>
                    <div className="text-[10px] font-mono uppercase text-white text-right break-words max-w-[60%]">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button
                onClick={() => setShowViewModal(false)}
                className="border border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowViewModal(false);
                  navigate(`/users/${selectedUser.id}`);
                }}
                className="border border-white/20 bg-white text-black hover:bg-white/90 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Ban User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setBanExpiresIn(undefined);
                  setSelectedUser(null);
                }}
                disabled={isBanning}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="w-14 h-14 object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <CopyableId id={selectedUser.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <div>
                <Label htmlFor="banReason" className="text-xs text-white/80 font-mono uppercase">
                  Ban Reason
                </Label>
                <Input
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for ban (optional)"
                  disabled={isBanning}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
              </div>
              <div>
                <Label htmlFor="banExpires" className="text-xs text-white/80 font-mono uppercase">
                  Ban Duration (seconds)
                </Label>
                <Input
                  id="banExpires"
                  type="number"
                  value={banExpiresIn || ""}
                  onChange={(e) =>
                    setBanExpiresIn(e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Leave empty for permanent ban"
                  disabled={isBanning}
                  className="mt-1 border border-dashed border-white/20 bg-black/30 text-white rounded-none"
                />
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  Examples: 3600 (1 hour), 86400 (1 day), 604800 (1 week)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBanModal(false);
                  setBanReason("");
                  setBanExpiresIn(undefined);
                  setSelectedUser(null);
                }}
                disabled={isBanning}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBanUser}
                disabled={isBanning}
                className="bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isBanning ? "Banning..." : "Ban User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unban User Modal */}
      {showUnbanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-black border border-white/15 rounded-none p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-white font-light uppercase font-mono">Unban User</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowUnbanModal(false);
                  setSelectedUser(null);
                }}
                disabled={isUnbanning}
                className="text-gray-400 -mt-2 hover:text-white rounded-none"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center mt-2">
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
              <div className="relative z-20 h-4 w-[calc(100%+3rem)] mx-auto -translate-x-1/2 left-1/2 bg-[repeating-linear-gradient(-45deg,#ffffff,#ffffff_1px,transparent_1px,transparent_6px)] opacity-[7%]" />
              <hr className="w-[calc(100%+3rem)] border-white/10 h-px" />
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 rounded-none border border-dashed border-white/15 bg-white/10 flex items-center justify-center overflow-hidden">
                  {selectedUser.image ? (
                    <img
                      src={selectedUser.image}
                      alt={selectedUser.name}
                      className="w-14 h-14 object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="text-white font-medium leading-tight flex items-center gap-2">
                    <span>{selectedUser.name}</span>
                    <CopyableId id={selectedUser.id} variant="subscript" nonSliced={true} />
                  </div>
                  <div className="text-sm text-gray-400">{selectedUser.email}</div>
                </div>
              </div>
              <p className="text-gray-400">
                Are you sure you want to unban this user? This will restore their access to the
                system.
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUnbanModal(false);
                  setSelectedUser(null);
                }}
                disabled={isUnbanning}
                className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none font-mono uppercase text-xs tracking-tight"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUnbanUser}
                disabled={isUnbanning}
                className="bg-green-400 hover:bg-green-500 text-white border border-green-400 rounded-none disabled:opacity-50 font-mono uppercase text-xs tracking-tight"
              >
                {isUnbanning ? "Unbanning..." : "Unban User"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
