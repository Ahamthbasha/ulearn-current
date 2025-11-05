import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { Button } from "../../../components/common/Button";
import { getModuleById, updateModule } from "../../../api/action/InstructorActionApi";
import { AxiosError } from "axios";

// Enhanced regex: allows letters, numbers, and limited special characters
const meaningfulTextRegex = /^[A-Za-z0-9]+([\s\-,.!?'()&][A-Za-z0-9]+)*$/;

const moduleSchema = Yup.object().shape({
  moduleTitle: Yup.string()
    .transform((value) => value?.trim())
    .required("Module title is required")
    .min(5, "Module title must be at least 5 characters long")
    .max(50, "Module title should not exceed 50 characters")
    .matches(
      meaningfulTextRegex,
      "Module title must contain meaningful text with proper spacing"
    )
    .test(
      "no-repetitive-chars",
      "Module title cannot contain repetitive characters (e.g., 'aaaa' or 'rrrr')",
      (value) => {
        if (!value) return false;
        // Check for 3+ consecutive identical characters
        return !/(.)\1{2,}/.test(value);
      }
    )
    .test(
      "meaningful-content",
      "Module title must contain varied characters, not just repetition",
      (value) => {
        if (!value) return false;
        const uniqueChars = new Set(value.toLowerCase().replace(/\s/g, ""));
        // Must have at least 3 different characters
        return uniqueChars.size >= 3;
      }
    ),

  description: Yup.string()
    .transform((value) => value?.trim())
    .required("Description is required")
    .min(10, "Description must be at least 10 characters long")
    .max(100, "Description should not exceed 100 characters")
    .matches(
      meaningfulTextRegex,
      "Description must contain meaningful text with proper spacing"
    )
    .test(
      "no-repetitive-chars",
      "Description cannot contain repetitive characters (e.g., 'aaaa' or 'rrrr')",
      (value) => {
        if (!value) return false;
        // Check for 3+ consecutive identical characters
        return !/(.)\1{2,}/.test(value);
      }
    )
    .test(
      "meaningful-content",
      "Description must contain varied characters, not just repetition",
      (value) => {
        if (!value) return false;
        const uniqueChars = new Set(value.toLowerCase().replace(/\s/g, ""));
        // Must have at least 5 different characters for longer text
        return uniqueChars.size >= 5;
      }
    ),
});

const EditModulePage = () => {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    moduleTitle: "",
    description: "",
  });

  const [moduleNumber, setModuleNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      if (!moduleId) return;

      try {
        const data = await getModuleById(moduleId);
        if (!data) {
          toast.error("Module not found");
          return;
        }

        setInitialValues({
          moduleTitle: data.moduleTitle || "",
          description: data.description || "",
        });

        setModuleNumber(data.moduleNumber || null);
      } catch {
        toast.error("Failed to load module");
      }
    };

    fetchModule();
  }, [moduleId]);

  const handleSubmit = async (values: typeof initialValues) => {
    if (!moduleId) return toast.error("Invalid request");

    try {
      setLoading(true);

      const moduleData = {
        moduleTitle: values.moduleTitle.trim(),
        description: values.description.trim(),
      };

      await updateModule(moduleId, moduleData);
      toast.success("Module updated successfully");
      navigate(`/instructor/course/${courseId}/modules`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error?.response?.data?.message || "Failed to update module";
        toast.error(message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <Card title="Edit Module" padded className="bg-white shadow-sm rounded-lg">
        {moduleNumber !== null && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-md text-sm text-indigo-800 flex items-center gap-2">
            <span className="font-bold">Module #{moduleNumber}</span>
            <span className="text-xs text-indigo-600">(Auto-generated)</span>
          </div>
        )}

        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={moduleSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField
                name="moduleTitle"
                label="Module Title"
                useFormik
                placeholder="e.g., Introduction to React"
              />
              <InputField
                name="description"
                label="Description"
                useFormik
                placeholder="e.g., Learn React fundamentals and hooks"
              />

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Saving...
                  </div>
                ) : (
                  "Update Module"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default EditModulePage;