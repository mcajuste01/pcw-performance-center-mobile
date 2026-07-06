import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";

// Predefined in-app destinations coaches can link a task to
export const ACTION_LINK_OPTIONS = [
  { value: "none", label: "None — No in-app action required" },
  { value: "CharacterBuilder|identity|Build your character identity", label: "Character Builder → Identity" },
  { value: "CharacterBuilder|moveset|Build your move set", label: "Character Builder → Move Set" },
  { value: "CharacterBuilder|special|Add your specials & finisher", label: "Character Builder → Specials & Finisher" },
  { value: "CharacterBuilder|psychology|Write your match psychology", label: "Character Builder → Psychology" },
  { value: "CharacterBuilder|objective|Define your match strategy", label: "Character Builder → Match Strategy" },
  { value: "CharacterBuilder|expression|Complete your presentation", label: "Character Builder → Presentation" },
  { value: "Workouts|null|Log your workout", label: "Workouts → Log a Workout" },
  { value: "SkillTracking|null|Log your training session", label: "Skill Tracking → Log Training" },
  { value: "VideoAnalysis|null|Upload your video", label: "Video Analysis → Upload Video" },
  { value: "Notebook|null|Write a notebook entry", label: "Notebook → Write Entry" },
  { value: "CheckIn|null|Check in to class", label: "Check In → Attend a Session" },
];

// Parse a stored action_link object back to the picker value string
export function actionLinkToValue(actionLink) {
  if (!actionLink?.page) return "none";
  return `${actionLink.page}|${actionLink.tab || "null"}|${actionLink.label || ""}`;
}

// Parse the picker value string into an action_link object
export function valueToActionLink(value) {
  if (!value || value === "none") return null;
  const [page, tab, ...rest] = value.split("|");
  return {
    page,
    tab: tab === "null" ? null : tab,
    label: rest.join("|"),
  };
}

export default function ActionLinkPicker({ value, onChange }) {
  const currentValue = actionLinkToValue(value);

  return (
    <div className="space-y-1">
      <Label className="text-gray-300 flex items-center gap-2">
        <ExternalLink className="w-4 h-4 text-purple-400" />
        In-App Action <span className="text-gray-500 font-normal">(Optional)</span>
      </Label>
      <Select
        value={currentValue}
        onValueChange={(v) => onChange(valueToActionLink(v))}
      >
        <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
          <SelectValue placeholder="Link this task to a section of the app..." />
        </SelectTrigger>
        <SelectContent>
          {ACTION_LINK_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value?.page && (
        <p className="text-xs text-purple-400 mt-1">
          Trainees will see a button: "<strong>{value.label}</strong>" that takes them directly to {value.page}{value.tab ? ` → ${value.tab}` : ""}.
        </p>
      )}
    </div>
  );
}