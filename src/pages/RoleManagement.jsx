import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Shield,
  Users,
  Award,
  Crown,
  Trash2,
  UserPlus,
  Mail,
  Search,
  Filter,
  UserCircle2,
  AtSign,
  Clock,
  Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import { toast } from "sonner";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value?.items && Array.isArray(value.items)) return value.items;
  return [];
};

export default function RoleManagement() {
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);

  // dialogs
  const [showAddUser, setShowAddUser] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);

  // forms
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    wrestling_name: "",
    tier: "T1",
    roles: ["trainee"],
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("trainee");
  const [isSendingInvite, setIsSendingInvite] = useState(false);


  // filters / tabs
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("users"); // "users" | "invites"

  // ===== AUTH GUARD =====
  useEffect(() => {
  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const roles = currentUser?.roles || [];
      const isAdmin = roles.includes("admin") || currentUser?.role === "admin";

      if (!isAdmin) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error loading current user:", error);
      toast.error("Failed to load user session. Please refresh and try again.");
    }
  };

  loadUser();
}, []);


  // ===== QUERIES =====
  const {
    data: allUsers = [],
    isLoading: usersLoading,
    isError: usersError,
  } = useQuery({
    queryKey: ["allUsers"],
    queryFn: async () => {
      const [profilesRes, authUsersRes] = await Promise.all([
        base44.entities.UserProfile.list("full_name", 500),
        base44.entities.User.list("full_name", 500),
      ]);
      const profiles = toArray(profilesRes);
      const authUsers = toArray(authUsersRes);

      // Build a map of auth_user_id -> profile for quick lookup
      const profileByAuthId = {};
      profiles.forEach((p) => {
        if (p.auth_user_id) profileByAuthId[p.auth_user_id] = p;
      });

      // Merge: start with all auth users, attach profile if exists
      const merged = authUsers.map((authUser) => {
        const profile = profileByAuthId[authUser.id];
        if (profile) {
          return {
            ...profile,
            _profile_id: profile.id,
            id: authUser.id,
            full_name: profile.full_name || authUser.full_name,
            email: profile.email || authUser.email,
            roles: profile.roles || (profile.role ? [profile.role] : ["trainee"]),
          };
        }
        // Auth user with no profile yet
        return {
          id: authUser.id,
          full_name: authUser.full_name || authUser.email,
          email: authUser.email,
          role: authUser.role || "trainee",
          roles: authUser.roles || (authUser.role ? [authUser.role] : ["trainee"]),
          _profile_id: null,
          _no_profile: true,
        };
      });

      return merged.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    },
    initialData: [],
    refetchInterval: 15000,
  });

  // Real-time: refetch when a UserProfile is created or updated
  useEffect(() => {
    const unsubscribe = base44.entities.UserProfile.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
    });
    return unsubscribe;
  }, [queryClient]);

  const {
    data: allInvites = [],
    isLoading: invitesLoading,
    isError: invitesError,
  } = useQuery({
    queryKey: ["authInvites"],
    queryFn: async () => {
      try {
        const res = await base44.entities.PendingInvite.filter({ status: "pending" });
        return toArray(res);
      } catch (err) {
        console.error("Error loading invites:", err);
        return [];
      }
    },
    initialData: [],
  });

  // ===== MUTATIONS =====

  // update roles on both User (roles array) AND UserProfile (role string)
  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles, profileId, userData }) => {
      const primaryRole = roles[0] || "trainee";

      // 1. Update UserProfile (always works)
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, { role: primaryRole, roles });
      } else {
        const profiles = await base44.entities.UserProfile.filter({ auth_user_id: userId });
        const profileArr = toArray(profiles);
        if (profileArr.length > 0) {
          await base44.entities.UserProfile.update(profileArr[0].id, { role: primaryRole, roles });
        } else {
          // No profile exists yet — create one
          await base44.entities.UserProfile.create({
            auth_user_id: userId,
            full_name: userData?.full_name || userData?.email || "",
            email: userData?.email || "",
            role: primaryRole,
            roles,
            onboarding_completed: false,
          });
        }
      }

      // 2. Also try to update User entity (may fail silently for non-admins)
      try {
        await base44.entities.User.update(userId, { roles });
      } catch (e) {
        // not critical if this fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Roles updated successfully!");
    },
    onError: (error) => {
      toast.error(
        "Failed to update roles: " + (error?.message || "Permission denied")
      );
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, profileId }) => {
      if (profileId) {
        await base44.entities.UserProfile.delete(profileId);
      } else {
        const profiles = await base44.entities.UserProfile.filter({ auth_user_id: userId });
        const profileArr = toArray(profiles);
        if (profileArr.length > 0) {
          await base44.entities.UserProfile.delete(profileArr[0].id);
        }
      }
      // Also try auth User delete
      try { await base44.entities.User.delete(userId); } catch (e) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User deleted successfully!");
    },
    onError: (error) => {
      toast.error(
        "Failed to delete user: " + (error?.message || "Permission denied")
      );
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      return base44.entities.UserProfile.create({
        auth_user_id: `manual_${Date.now()}`,
        full_name: userData.full_name,
        email: userData.email,
        wrestling_name: userData.wrestling_name,
        tier: userData.tier,
        role: userData.roles[0] || "trainee",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("User profile added! They'll need to sign up to activate.");
      setShowAddUser(false);
      setNewUser({
        full_name: "",
        email: "",
        wrestling_name: "",
        tier: "T1",
        roles: ["trainee"],
      });
    },
    onError: (error) => {
      toast.error("Failed to add user: " + (error?.message || "Unknown error"));
    },
  });

  // --- MUTATION: send invite email (frontend) ---
const sendInviteMutation = useMutation({
  mutationFn: async ({ email, role }) => {
    // IMPORTANT: this only emails — it does NOT create a real auth account invite.
    // We'll fix "true invites" after this is working reliably.
    return await base44.integrations.Core.SendEmail({
      to: email,
      subject: "You're invited to join PCW Training Center",
      body:
        `You've been invited to join PCW Training Center as a ${role}.\n\n` +
        `Click here to create your account and get started:\n${window.location.origin}\n\n` +
        `Default on acceptance: trainee, T1.\n\n` +
        `- PCW`,
    });
  },
  onSuccess: () => {
    toast.success("Invitation email sent!");
    setShowInviteUser(false);
    setInviteEmail("");
    setInviteRole("trainee");
    setIsSendingInvite(false); // Reset loading state
  },
  onError: (error) => {
    console.error("Invite error (full):", error);
    const detail =
      error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message || String(error);
    toast.error("Failed to send invitation: " + detail);
    setIsSendingInvite(false); // Reset loading state
  },
});

  // simple resend: just re-send the email with same URL (if available)
  const resendInviteMutation = useMutation({
    mutationFn: async (invite) => {
      const email = invite.email;
      const url = invite.url;
      const role = invite.metadata?.role || "trainee";

      if (!email || !url) {
        throw new Error("Missing email or invite URL");
      }

      await base44.integrations.Core.SendEmail({
        to: email,
        subject: "Reminder: Your PCW Training Center Invite",
        body: `This is a reminder to complete your PCW Training Center signup as a ${role}.\n\nUse this link to finish creating your account:\n${url}\n\nWe look forward to seeing you in training!`,
      });

      return true;
    },
    onSuccess: () => {
      toast.success("Invite email re-sent!");
    },
    onError: (error) => {
      console.error("Resend error:", error);
      toast.error(
        "Failed to resend invite: " + (error?.message || "Unknown error")
      );
    },
  });

  // ===== HELPERS =====
  const handleSendInvite = () => {
  const email = inviteEmail.trim();
  if (!email) {
    toast.error("Please enter an email address");
    return;
  }
  setIsSendingInvite(true); // Set loading state before mutation
  sendInviteMutation.mutate({ email, role: inviteRole });
};


  const toggleRole = (userId, role, currentRoles, profileId) => {
    const roles = currentRoles || [];
    const newRoles = roles.includes(role)
      ? roles.filter((r) => r !== role)
      : [...roles, role];

    if (newRoles.length === 0) {
      toast.error("User must have at least one role");
      return;
    }

    updateRolesMutation.mutate({ userId, roles: newRoles, profileId, userData: allUsers.find(u => u.id === userId) });
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Crown;
      case "coach":
        return Shield;
      case "trainee":
        return Users;
      default:
        return Award;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "#dc2626";
      case "coach":
        return "#8b3dff";
      case "trainee":
        return "#c0c0c0";
      default:
        return "#666666";
    }
  };

  const filteredUsers = useMemo(() => {
    return toArray(allUsers)
      .filter((u) => {
        const name = (u.wrestling_name || u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const term = searchTerm.toLowerCase();

        if (term && !name.includes(term) && !email.includes(term)) return false;

        const roles = u.roles || ["trainee"];
        if (roleFilter !== "all" && !roles.includes(roleFilter)) return false;

        return true;
      })
      .sort((a, b) =>
        (a.wrestling_name || a.full_name || "").localeCompare(
          b.wrestling_name || b.full_name || ""
        )
      );
  }, [allUsers, searchTerm, roleFilter]);

  // Coach requests
  const coachRequests = toArray(allUsers).filter((u) => u.coach_request === true && u.role !== "coach");

  const approveCoachMutation = useMutation({
    mutationFn: async ({ userId, profileId }) => {
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, { role: "coach", coach_request: false });
      }
      try { await base44.entities.User.update(userId, { role: "coach" }); } catch (e) {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Coach approved!");
    },
    onError: () => toast.error("Failed to approve coach"),
  });

  const denyCoachMutation = useMutation({
    mutationFn: async ({ profileId }) => {
      if (profileId) {
        await base44.entities.UserProfile.update(profileId, { coach_request: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      toast.success("Coach request denied.");
    },
    onError: () => toast.error("Failed to deny request"),
  });

  // counts for summary badges
  const adminsCount = toArray(allUsers).filter((u) => {
    const roles = u.roles || [];
    return roles.includes("admin") || u.role === "admin";
  }).length;

  const coachesCount = toArray(allUsers).filter((u) => {
    const roles = u.roles || [];
    return roles.includes("coach");
  }).length;

  const traineesCount = toArray(allUsers).filter((u) => {
    const roles = u.roles || [];
    const isAdmin = roles.includes("admin") || u.role === "admin";
    const isCoach = roles.includes("coach") || u.role === "coach";
    return !isAdmin && !isCoach && (roles.includes("trainee") || roles.length === 0);
  }).length;

  const pendingInvitesCount = toArray(allInvites).length;

  const formatDateTime = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  };

  // ===== RENDER =====
  return (
    <div
      className="min-h-screen p-6 md:p-8"
      style={{
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="w-8 h-8" style={{ color: "#dc2626" }} />
                Role Management
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                Assign roles, invite new users, and manage access to the PCW Training Center.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
               {/* Invite User */}
              <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#8b3dff" }}>
                    <Mail className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent
                  style={{ background: "#0f0f0f", border: "1px solid #333" }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Invite User via Email
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Send an invitation for someone to create an account with a
                      pre-assigned role.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-gray-300">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Role</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v)}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="trainee">Trainee</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInviteUser(false)}
                      style={{ borderColor: "#666", color: "#999" }}
                      disabled={isSendingInvite}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSendInvite}
                      disabled={isSendingInvite || !inviteEmail.trim()}
                      style={{ background: "#8b3dff" }}
                    >
                      {isSendingInvite ? "Sending..." : "Send Invitation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Add User */}
              <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
                <DialogTrigger asChild>
                  <Button style={{ background: "#dc2626" }}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent
                  style={{ background: "#0f0f0f", border: "1px solid #333" }}
                >
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      Add New User
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a manual profile for someone already in the system
                      or joining soon.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-gray-300">Full Name</Label>
                      <Input
                        placeholder="John Doe"
                        value={newUser.full_name}
                        onChange={(e) =>
                          setNewUser({ ...newUser, full_name: e.target.value })
                        }
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Email</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">
                        Wrestling Name (Optional)
                      </Label>
                      <Input
                        placeholder="The Butcher"
                        value={newUser.wrestling_name}
                        onChange={(e) =>
                          setNewUser({
                            ...newUser,
                            wrestling_name: e.target.value,
                          })
                        }
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Tier</Label>
                      <Select
                        value={newUser.tier}
                        onValueChange={(v) =>
                          setNewUser({ ...newUser, tier: v })
                        }
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="T1">T1</SelectItem>
                          <SelectItem value="T2">T2</SelectItem>
                          <SelectItem value="T3">T3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300 mb-2 block">Roles</Label>
                      <div className="flex gap-4 flex-wrap">
                        {["trainee", "coach", "admin"].map((role) => (
                          <label
                            key={role}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={newUser.roles.includes(role)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setNewUser({
                                    ...newUser,
                                    roles: [...newUser.roles, role],
                                  });
                                } else {
                                  setNewUser({
                                    ...newUser,
                                    roles: newUser.roles.filter(
                                      (r) => r !== role
                                    ),
                                  });
                                }
                              }}
                            />
                            <span className="text-sm text-white capitalize">
                              {role}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddUser(false)}
                      style={{ borderColor: "#666", color: "#999" }}
                      disabled={addUserMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => addUserMutation.mutate(newUser)}
                      disabled={
                        !newUser.full_name ||
                        !newUser.email ||
                        newUser.roles.length === 0 ||
                        addUserMutation.isPending
                      }
                      style={{ background: "#dc2626" }}
                    >
                      {addUserMutation.isPending ? "Adding..." : "Add User"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-900/40">
                <Crown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Admins</p>
                <p className="text-xl font-bold text-white">{adminsCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-900/40">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Coaches</p>
                <p className="text-xl font-bold text-white">{coachesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-gray-800">
                <Users className="w-5 h-5 text-gray-300" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Trainees</p>
                <p className="text-xl font-bold text-white">{traineesCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-indigo-900/40">
                <Mail className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Pending Invites</p>
                <p className="text-xl font-bold text-white">
                  {pendingInvitesCount}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FILTERS + TABS */}
        <Card
          className="border-gray-800 mb-8"
          style={{ background: "#0f0f0f" }}
        >
          <CardContent className="p-5 space-y-5">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="bg-gray-900 border-gray-700 text-white pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select
                  value={roleFilter}
                  onValueChange={(v) => setRoleFilter(v)}
                >
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-40">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="coach">Coaches</SelectItem>
                    <SelectItem value="trainee">Trainees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* tabs */}
            <div className="flex gap-2 border-b border-gray-800 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("users")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "users"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pending_invites")}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === "pending_invites"
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Pending Invites
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("coach_requests")}
                className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
                  activeTab === "coach_requests"
                    ? "border-red-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                }`}
              >
                Coach Requests
                {coachRequests.length > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#dc2626", color: "#fff" }}>
                    {coachRequests.length}
                  </span>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* TAB CONTENT */}
        {activeTab === "users" && (
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardHeader>
              <CardTitle className="text-white">
                All Users{" "}
                {filteredUsers.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({filteredUsers.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading && (
                <p className="text-gray-500 py-8 text-center">
                  Loading users…
                </p>
              )}
              {usersError && !usersLoading && (
                <p className="text-red-400 py-8 text-center">
                  Failed to load users.
                </p>
              )}
              {!usersLoading && filteredUsers.length === 0 && (
                <p className="text-gray-500 py-8 text-center">
                  No users found. Try adjusting filters.
                </p>
              )}

              <div className="space-y-5">
                {filteredUsers.map((u) => {
                  const userRoles = u.roles || ["trainee"];
                  const profileId = u._profile_id;

                  return (
                    <div
                      key={u.id}
                      className="p-4 rounded-lg border border-gray-800"
                      style={{ background: "#0a0a0a" }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: identity */}
                        <div className="flex items-center gap-4 flex-1">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{
                              background:
                                "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)",
                            }}
                          >
                            <span className="text-white font-bold">
                              {u.wrestling_name?.[0]?.toUpperCase() ||
                                u.full_name?.[0]?.toUpperCase() ||
                                "?"}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {u.wrestling_name || u.full_name || "Unnamed User"}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {u.email || "No email on file"}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {userRoles.map((role) => {
                                const Icon = getRoleIcon(role);
                                const color = getRoleColor(role);
                                return (
                                  <span
                                    key={role}
                                    className="text-xs px-2 py-1 rounded flex items-center gap-1"
                                    style={{
                                      background: `${color}20`,
                                      color,
                                    }}
                                  >
                                    <Icon className="w-3 h-3" />
                                    {role}
                                  </span>
                                );
                              })}
                              {u._no_profile && (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-900/30 text-yellow-400 border border-yellow-800/50">
                                  No profile yet
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: view + role toggles + delete */}
                        <div className="flex items-center gap-6">
                          <Link to={createPageUrl("UserDetail") + `?id=${u.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-600 text-gray-300 hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <div className="flex flex-col gap-2">
                            {["admin", "coach", "trainee"].map((role) => {
                              const Icon = getRoleIcon(role);
                              const isChecked = userRoles.includes(role);
                              const color = getRoleColor(role);

                              return (
                                <label
                                  key={role}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() =>
                                      toggleRole(u.id, role, userRoles, profileId)
                                    }
                                  />
                                  <Icon
                                    className="w-4 h-4"
                                    style={{ color }}
                                  />
                                  <span className="text-sm text-white capitalize">
                                    {role}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                style={{
                                  borderColor: "#dc2626",
                                  color: "#dc2626",
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent
                              style={{
                                background: "#0f0f0f",
                                border: "1px solid #333",
                              }}
                            >
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">
                                  Delete User
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Are you sure you want to delete{" "}
                                  {u.wrestling_name ||
                                    u.full_name ||
                                    "this user"}
                                  ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  style={{
                                    borderColor: "#666",
                                    color: "#999",
                                  }}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteUserMutation.mutate({ userId: u.id, profileId })
                                  }
                                  style={{ background: "#dc2626" }}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "pending_invites" && (
          <Card
            className="border-gray-800"
            style={{ background: "#0f0f0f" }}
          >
            <CardHeader>
              <CardTitle className="text-white">
                Pending Invites{" "}
                {pendingInvitesCount > 0 && (
                  <span className="text-sm text-gray-500">
                    ({pendingInvitesCount})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitesLoading && (
                <p className="text-gray-500 py-8 text-center">
                  Loading invites…
                </p>
              )}
              {invitesError && !invitesLoading && (
                <p className="text-red-400 py-8 text-center">
                  Failed to load invites.
                </p>
              )}
              {!invitesLoading && pendingInvitesCount === 0 && (
                <p className="text-gray-500 py-8 text-center">
                  No pending invites right now.
                </p>
              )}

              <div className="space-y-4">
                {toArray(allInvites).map((invite) => (
                  <div
                    key={invite.id}
                    className="p-4 rounded-lg border border-gray-800 flex items-center justify-between gap-4"
                    style={{ background: "#0a0a0a" }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-900/40">
                        <UserCircle2 className="w-5 h-5 text-indigo-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <AtSign className="w-3 h-3 text-gray-500" />
                          <p className="text-sm text-white">
                            {invite.email || "Unknown email"}
                          </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Role:{" "}
                          <span className="font-medium">
                            {invite.metadata?.role || "trainee"}
                          </span>
                        </p>
                        {invite.created_at && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Invited: {formatDateTime(invite.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        style={{ borderColor: "#8b3dff", color: "#8b3dff" }}
                        onClick={() => resendInviteMutation.mutate(invite)}
                        disabled={resendInviteMutation.isPending}
                      >
                        Resend
                      </Button>
                      {/* If Base44 adds a revoke/cancel API later, hook it here */}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "coach_requests" && (
          <Card className="border-gray-800" style={{ background: "#0f0f0f" }}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5" style={{ color: "#dc2626" }} />
                Coach Requests
                {coachRequests.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold ml-1" style={{ background: "#dc2626", color: "#fff" }}>
                    {coachRequests.length} pending
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coachRequests.length === 0 ? (
                <p className="text-gray-500 py-8 text-center">No pending coach requests.</p>
              ) : (
                <div className="space-y-4">
                  {coachRequests.map((u) => (
                    <div key={u.id} className="p-4 rounded-lg border border-yellow-800/40 flex items-center justify-between gap-4"
                      style={{ background: "rgba(220,150,0,0.05)" }}>
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg, #dc2626 0%, #8b3dff 100%)" }}>
                          <span className="text-white font-bold">
                            {u.wrestling_name?.[0]?.toUpperCase() || u.full_name?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{u.wrestling_name || u.full_name || "Unknown"}</h3>
                          <p className="text-sm text-gray-400">{u.email}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-900/40 text-yellow-300 border border-yellow-700/40">
                              🕐 Coach request pending
                            </span>
                            {u.bio && <span className="text-xs text-gray-500 truncate max-w-xs">{u.bio}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveCoachMutation.mutate({ userId: u.id, profileId: u._profile_id })}
                          disabled={approveCoachMutation.isPending}
                          style={{ background: "#10b981" }}
                        >
                          Approve Coach
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => denyCoachMutation.mutate({ profileId: u._profile_id })}
                          disabled={denyCoachMutation.isPending}
                          style={{ borderColor: "#dc2626", color: "#dc2626" }}
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}