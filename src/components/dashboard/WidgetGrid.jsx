/**
 * WidgetGrid — renders the user's chosen widgets in their saved order.
 * Supports drag-to-reorder via @hello-pangea/dnd.
 */
import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

export default function WidgetGrid({ widgets, widgetComponents, onReorder }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const reordered = Array.from(widgets);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    onReorder(reordered);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="dashboard-widgets">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
            {widgets.map((widgetId, index) => {
              const Widget = widgetComponents[widgetId];
              if (!Widget) return null;
              return (
                <Draggable key={widgetId} draggableId={widgetId} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`relative group transition-all ${snapshot.isDragging ? "opacity-80 scale-[0.99] shadow-2xl" : ""}`}
                    >
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 hidden md:flex"
                      >
                        <GripVertical className="w-4 h-4 text-gray-600" />
                      </div>
                      <Widget />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}