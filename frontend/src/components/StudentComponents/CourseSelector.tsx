import React, { useState, useEffect } from "react";
import { FieldArray, useField } from "formik";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DroppableProvided,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DropResult,
} from "@hello-pangea/dnd";

import InputField from "../common/InputField";
import { getAllCourses } from "../../api/action/StudentAction";
import type { CourseDTO, CourseItem } from "../../types/interfaces/IStudentInterface";

interface CourseSelectorProps {
  name: string;
  label: string;
  categoryId?: string;
}

const renumber = (arr: CourseItem[]): CourseItem[] =>
  arr.map((it, i) => ({ ...it, order: i + 1 }));

const CourseSelector: React.FC<CourseSelectorProps> = ({
  name,
  label,
  categoryId,
}) => {
  const [field, , helpers] = useField<CourseItem[]>(name);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!categoryId) {
        setCourses([]);
        return;
      }
      try {
        const resp = await getAllCourses(categoryId);
        if (resp.success) setCourses(resp.data);
        else setError("Failed to load courses");
      } catch (e) {
        setError("Failed to load courses");
      }
    };
    load();
  }, [categoryId]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(field.value);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    helpers.setValue(renumber(items));
  };

  return (
    <div className="w-full">
      <label className="block text-gray-800 text-xs sm:text-sm font-semibold mb-1">
        {label.toUpperCase()}
      </label>

      <FieldArray name={name}>
        {({ push }) => {
          const add = () =>
            push({ courseId: "", order: field.value.length + 1 });

          const removeAndRenumber = (idx: number) => {
            const filtered = field.value.filter((_, i) => i !== idx);
            helpers.setValue(renumber(filtered));
          };

          const changeCourse = (
            e: React.ChangeEvent<HTMLSelectElement>,
            idx: number
          ) => {
            const copy = [...field.value];
            copy[idx].courseId = e.target.value;
            helpers.setValue(copy);
          };

          return (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="course-list">
                {(provided: DroppableProvided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {field.value.map((item: CourseItem, idx: number) => (
                      <Draggable
                        key={`${item.courseId || "empty"}-${idx}`}
                        draggableId={`${item.courseId || "empty"}-${idx}`}
                        index={idx}
                      >
                        {(
                          dragProvided: DraggableProvided,
                          dragSnapshot: DraggableStateSnapshot
                        ) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={`flex items-center space-x-4 p-3 rounded-lg border transition-colors ${
                              dragSnapshot.isDragging
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {/* Drag Handle (icon) */}
                            <div className="text-gray-400 cursor-move">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6h16M4 12h16M4 18h16"
                                />
                              </svg>
                            </div>

                            {/* Course Dropdown */}
                            <div className="flex-1">
                              <select
                                value={item.courseId}
                                onChange={(e) => changeCourse(e, idx)}
                                className="w-full px-3 py-2 rounded-lg font-medium border-2 border-transparent text-black text-xs sm:text-sm focus:outline-none bg-gray-100"
                              >
                                <option value="">Select a course</option>
                                {courses.map((c) => (
                                  <option key={c._id} value={c._id}>
                                    {c.courseName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Order (read-only) */}
                            <div className="w-16 text-center">
                              <InputField
                                name={`${name}.${idx}.order`}
                                type="number"
                                label=""
                                value={item.order}
                                disabled
                              />
                            </div>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => removeAndRenumber(idx)}
                              className="text-red-500 text-sm hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button
                type="button"
                onClick={add}
                className="mt-3 text-blue-600 text-sm font-medium hover:underline"
              >
                + Add Course
              </button>

              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
            </DragDropContext>
          );
        }}
      </FieldArray>
    </div>
  );
};

export default CourseSelector;