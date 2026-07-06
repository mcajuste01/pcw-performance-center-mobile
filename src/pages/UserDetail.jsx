import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Edit2,
  Save,
  X,
  History,
  UserCog,
  Award,
  Activity,
  Trash2,
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  return [];
};

const getRoleColor = (role) => {
  switch (role) {
    case "admin": return "bg-red-500/20 text-red-400 border-red-500/30";
    case "coach": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "trainee": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
};

const getRoleIcon = (role) => {
  switch (role) {
    case "admin": return <Shield className="w-4 h-4" />;
    case "coach": return <Award className="w-4 h-4" />;
    default: return <User className="w-4 h-4" />;
  }
};

export default function UserDetail() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get("id");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  // Current admin user
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => base44.auth.me(),
  });

  // User profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ auth_user_id: userId });
      return toArray(profiles)[0] || null;
    },
  });

  // Auth user data
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["authUser", userId],
    enabled: !!userId,
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return toArray(users).find((u) => u.id === userId) || null;
    },
  });

  // Role change history
  const { data: roleHistory = [] } = useQuery({
    queryKey: ["roleHistory", userId],
    enabled: !!userId,
    queryFn: async () => {
      const logs = await base44.entities.RoleChangeLog.filter(
        { user_id: userId },
        "-created_date"
      );
      return toArray(logs);
    },
  });

  // Check-ins for activity
  const { data: checkIns = [] } = useQuery({
    queryKey: ["userCheckIns", userId],
    enabled: !!userId,
    queryFn: async () => {
      const res = await base44.entities.CheckIn.filter(
        { trainee_id: userId },
        "-check_in_date",
        10
      );
      return toArray(res);
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async () => {
      if (userProfile?.id) {
        await base44.entities.UserProfile.delete(userProfile.id);
      }
      try {
        await base44.entities.User.delete(userId);
      } catch (e) {
        // may fail silently
      }
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      navigate(createPageUrl("RoleManagement"));
    },
    onError: (err) => {
      toast.error("Failed to delete user: " + err.message);
    },
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (data) => {
      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, data);
      }
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error("Failed to update: " + err.message);
    },
  });

  // Update role mutation — syncs both User.roles AND UserProfile.role
  const updateRole = useMutation({
    mutationFn: async (newRole) => {
      const previousRole = effectiveRole;

      // Update User entity (roles array)
      await base44.entities.User.update(userId, { roles: [newRole] });

      // Update UserProfile (role string)
      if (userProfile?.id) {
        await base44.entities.UserProfile.update(userProfile.id, { role: newRole });
      }

      // Log the change
      await base44.entities.RoleChangeLog.create({
        user_id: userId,
        previous_role: previousRole,
        new_role: newRole,
        changed_by: me?.id,
        changed_by_name: me?.full_name || me?.email,
      });
    },
    onSuccess: () => {
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
      queryClient.invalidateQueries({ queryKey: ["authUser", userId] });
      queryClient.invalidateQueries({ queryKey: ["roleHistory", userId] });
    },
    onError: (err) => {
      toast.error("Failed to update role: " + err.message);
    },
  });

  const startEditing = () => {
    setFormData({
      full_name: userProfile?.full_name || "",
      wrestling_name: userProfile?.wrestling_name || "",
      tier: userProfile?.tier || "",
      pronouns: userProfile?.pronouns || "",
      bio: userProfile?.bio || "",
      height: userProfile?.height || "",
      weight: userProfile?.weight || "",
      years_training: userProfile?.years_training || "",
      specialties: userProfile?.specialties || "",
      emergency_contact: userProfile?.emergency_contact || "",
      medical_notes: userProfile?.medical_notes || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(formData);
  };

  const isLoading = profileLoading || authLoading;
  const user = userProfile || {};
  // Prefer roles array from User entity; fall back to UserProfile.role string
  const effectiveRole = authUser?.roles?.[0] || authUser?.role || userProfile?.role || "trainee";
  const registrationDate = authUser?.created_date || userProfile?.created_date;

  if (!userId) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <p className="text-gray-400">No user ID provided</p>
        <Link to={createPageUrl("RoleManagement")}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading user details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to={createPageUrl("RoleManagement")}>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
            </Button>
          </Link>

          {!isEditing ? (
            <div className="flex gap-2">
              {me?.role === "admin" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" style={{ borderColor: "#dc2626", color: "#dc2626" }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{ background: "#0f0f0f", border: "1px solid #333" }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-400">
                        Are you sure you want to permanently delete{" "}
                        <strong className="text-white">{user.wrestling_name || user.full_name || "this user"}</strong>?
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{ borderColor: "#555", color: "#999" }}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        style={{ background: "#dc2626" }}
                        onClick={() => deleteUser.mutate()}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                onClick={startEditing}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-gray-600"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateProfile.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfile.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold">
                {(user.wrestling_name || user.full_name || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">
                    {user.wrestling_name || user.full_name || "Unknown User"}
                  </h1>
                  <Badge className={getRoleColor(effectiveRole)}>
                    {getRoleIcon(effectiveRole)}
                    <span className="ml-1 capitalize">{effectiveRole}</span>
                  </Badge>
                </div>
                {user.wrestling_name && user.full_name && (
                  <p className="text-gray-400">{user.full_name}</p>
                )}
                <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {user.email || "No email"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <p className="text-xs text-gray-500">Registered</p>
              <p className="text-sm font-medium">
                {registrationDate
                  ? format(new Date(registrationDate), "MMM d, yyyy")
                  : "Unknown"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-green-400" />
              <p className="text-xs text-gray-500">Last Check-in</p>
              <p className="text-sm font-medium">
                {checkIns[0]?.check_in_date
                  ? formatDistanceToNow(new Date(checkIns[0].check_in_date), { addSuffix: true })
                  : "Never"}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <Activity className="w-5 h-5 mx-auto mb-2 text-purple-400" />
              <p className="text-xs text-gray-500">Total Check-ins</p>
              <p className="text-sm font-medium">{checkIns.length}+</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 text-center">
              <Award className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
              <p className="text-xs text-gray-500">Tier</p>
              <p className="text-sm font-medium">{user.tier || "T1"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Role Management (Admin Only) */}
        {me?.role === "admin" && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserCog className="w-5 h-5 text-red-400" />
                Role Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <p className="text-gray-400">Current Role:</p>
                <Select
                  value={effectiveRole}
                  onValueChange={(val) => updateRole.mutate(val)}
                  disabled={updateRole.isPending}
                >
                  <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="trainee">Trainee</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Details */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" />
              Profile Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Full Name"
                value={isEditing ? formData.full_name : user.full_name}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, full_name: v })}
              />
              <Field
                label="Wrestling Name"
                value={isEditing ? formData.wrestling_name : user.wrestling_name}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, wrestling_name: v })}
              />
              <Field
                label="Tier"
                value={isEditing ? formData.tier : user.tier}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, tier: v })}
              />
              <Field
                label="Pronouns"
                value={isEditing ? formData.pronouns : user.pronouns}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, pronouns: v })}
              />
              <Field
                label="Height"
                value={isEditing ? formData.height : user.height}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, height: v })}
              />
              <Field
                label="Weight"
                value={isEditing ? formData.weight : user.weight}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, weight: v })}
              />
              <Field
                label="Years Training"
                value={isEditing ? formData.years_training : user.years_training}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, years_training: v })}
              />
              <Field
                label="Specialties"
                value={isEditing ? formData.specialties : user.specialties}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, specialties: v })}
              />
            </div>

            <Field
              label="Bio"
              value={isEditing ? formData.bio : user.bio}
              editable={isEditing}
              multiline
              onChange={(v) => setFormData({ ...formData, bio: v })}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <Field
                label="Emergency Contact"
                value={isEditing ? formData.emergency_contact : user.emergency_contact}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, emergency_contact: v })}
              />
              <Field
                label="Medical Notes"
                value={isEditing ? formData.medical_notes : user.medical_notes}
                editable={isEditing}
                onChange={(v) => setFormData({ ...formData, medical_notes: v })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Role Change History */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Role Change History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roleHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No role changes recorded</p>
            ) : (
              <div className="space-y-3">
                {roleHistory.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Badge className={getRoleColor(log.previous_role)}>
                          {log.previous_role}
                        </Badge>
                        <span className="text-gray-500">→</span>
                        <Badge className={getRoleColor(log.new_role)}>
                          {log.new_role}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-gray-400">by {log.changed_by_name || "Unknown"}</p>
                      <p className="text-gray-600 text-xs">
                        {log.created_date
                          ? format(new Date(log.created_date), "MMM d, yyyy h:mm a")
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, editable, onChange, multiline }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      {editable ? (
        multiline ? (
          <Textarea
            className="bg-gray-800 border-gray-700 text-white"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            rows={3}
          />
        ) : (
          <Input
            className="bg-gray-800 border-gray-700 text-white"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
          />
        )
      ) : (
        <div className="px-3 py-2 bg-gray-800/50 rounded-md text-sm min-h-[38px]">
          {value || <span className="text-gray-600">—</span>}
        </div>
      )}
    </div>
  );
}