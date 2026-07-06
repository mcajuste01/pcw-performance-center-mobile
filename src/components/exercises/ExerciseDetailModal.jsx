import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, X, Edit2, Trash2, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getCategoryStyle, getCategoryMeta } from "@/components/exercises/exerciseConstants";

export default function ExerciseDetailModal({
  exercise,
  onClose,
  isFavorited,
  onToggleFavorite,
  canEdit,
  onEdit,
  onDelete,
}) {
  return (
    <Dialog open={!!exercise} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex-1">
            <DialogTitle className="text-2xl text-white">{exercise.name}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  className="text-gray-400 hover:text-white hover:bg-zinc-800"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  className="text-gray-400 hover:text-red-400 hover:bg-zinc-800"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleFavorite}
              className="text-gray-400 hover:text-white hover:bg-zinc-800"
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          {exercise.image_url && (
            <div className="rounded-lg overflow-hidden border border-zinc-800">
              <img src={exercise.image_url} alt={exercise.name} className="w-full max-h-64 object-cover" />
            </div>
          )}

          {/* Description */}
          {exercise.description && (
            <div>
              <p className="text-gray-300">{exercise.description}</p>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className="text-xs border capitalize" style={getCategoryStyle(exercise.category)}>
              {getCategoryMeta(exercise.category).label}
            </Badge>
            {exercise.difficulty && (
              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-300">
                {exercise.difficulty}
              </Badge>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Muscles</p>
                <div className="space-y-1">
                  {exercise.muscle_groups.map((m) => (
                    <p key={m} className="text-sm text-gray-300">{m}</p>
                  ))}
                </div>
              </div>
            )}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Equipment</p>
                <div className="space-y-1">
                  {exercise.equipment.map((e) => (
                    <p key={e} className="text-sm text-gray-300">{e}</p>
                  ))}
                </div>
              </div>
            )}
            {exercise.sets && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sets</p>
                <p className="text-sm text-gray-300">{exercise.sets}</p>
              </div>
            )}
            {exercise.reps && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Reps</p>
                <p className="text-sm text-gray-300">{exercise.reps}</p>
              </div>
            )}
            {exercise.rest_seconds && (
              <div className="rounded-lg bg-zinc-800/50 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rest</p>
                <p className="text-sm text-gray-300">{exercise.rest_seconds}s</p>
              </div>
            )}
          </div>

          {/* Video */}
          {exercise.video_url && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-4 h-4 text-purple-400" />
                <p className="text-sm font-semibold text-white">Video</p>
              </div>
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/30 rounded-lg text-purple-300 text-sm font-medium transition-colors"
              >
                Watch instructional video
                <span>→</span>
              </a>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Instructions</h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{exercise.instructions}</p>
              </div>
            </div>
          )}

          {/* Tips */}
          {exercise.tips && (
            <div className="rounded-lg bg-green-600/10 border border-green-600/20 p-4">
              <h3 className="text-sm font-semibold text-green-300 mb-2">Form Tips</h3>
              <p className="text-sm text-green-200/80 whitespace-pre-wrap">{exercise.tips}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}