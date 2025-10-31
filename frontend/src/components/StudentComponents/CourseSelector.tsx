import React, { useState, useEffect } from "react";
import { FieldArray, useField } from "formik";
import InputField from "../common/InputField";
import { getAllCourses } from "../../api/action/StudentAction";
import type { CourseDTO } from "../../types/interfaces/IStudentInterface";

interface CourseSelectorProps {
  name: string;
  label: string;
  categoryId?: string;
}

const CourseSelector: React.FC<CourseSelectorProps> = ({ name, label, categoryId }) => {
  const [field, , helpers] = useField(name);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getAllCourses(categoryId); 
        if (response.success) {
          setCourses(response.data); 
        } else {
          setError("Failed to fetch courses");
        }
      } catch (err: unknown) {
  let message = "Failed to fetch courses";

  if (err instanceof Error) {
    message = err.message;
  }

  setError(message);
}
    };
    fetchCourses();
  }, [categoryId]); // Re-fetch when categoryId changes

  return (
    <div className="w-full">
      <label className="block text-gray-800 text-xs sm:text-sm font-semibold mb-1">
        {label.toUpperCase()}
      </label>
      <FieldArray name={name}>
        {({ push, remove }) => (
          <div>
            {field.value.map((item: { courseId: string; order: number }, index: number) => (
              <div key={`course-selector-${index}`} className="flex items-center space-x-4 mb-2">
                <div className="flex-1">
                  <select
                    key={`course-select-${index}`}
                    name={`${name}.${index}.courseId`}
                    value={item.courseId}
                    onChange={(e) => {
                      const newValue = [...field.value];
                      newValue[index].courseId = e.target.value;
                      helpers.setValue(newValue);
                    }}
                    className="w-full px-3 py-2 rounded-lg font-medium border-2 border-transparent text-black text-xs sm:text-sm focus:outline-none bg-gray-100"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course: CourseDTO) => (
                      <option key={course._id} value={course._id}>
                        {course.courseName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <InputField
                    name={`${name}.${index}.order`}
                    type="number"
                    placeholder="Order"
                    label="Order"
                    value={item.order}
                    onChange={(e) => {
                      const newValue = [...field.value];
                      newValue[index].order = Number(e.target.value);
                      helpers.setValue(newValue);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => push({ courseId: "", order: field.value.length + 1 })}
              className="mt-2 text-blue-500 text-sm"
            >
              Add Course
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>
        )}
      </FieldArray>
    </div>
  );
};

export default CourseSelector;