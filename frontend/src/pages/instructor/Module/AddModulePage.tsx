import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { createModule } from "../../../api/action/InstructorActionApi";
import { Button } from "../../../components/common/Button";
import { Loader2 } from "lucide-react";
import type { ModuleFormValues } from "../interface/instructorInterface";

// Enhanced regex: allows letters, numbers, and limited special characters
const meaningfulTextRegex = /^[A-Za-z0-9]+([\s\-,.!?'()&][A-Za-z0-9]+)*$/;

const moduleSchema = Yup.object().shape({
  moduleTitle: Yup.string()
    .transform((value) => value.trim())
    .min(5, "Module title must be at least 5 characters long")
    .max(50, "Title should not exceed 50 characters")
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
    )
    .test(
      "not-blank",
      "Module title cannot be only spaces",
      (value) => !!value && value.trim().length >= 5
    )
    .required("Module title is required"),

  description: Yup.string()
    .transform((value) => value.trim())
    .min(10, "Description must be at least 10 characters long")
    .max(100, "Module description should not exceed 100 characters")
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
    )
    .test(
      "not-blank",
      "Description cannot be only spaces",
      (value) => !!value && value.trim().length >= 10
    )
    .required("Description is required"),
});

const AddModulePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const getErrorMessage = (error: unknown): string => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data
    ) {
      return String((error.response.data as { message?: string }).message);
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Module creation failed";
  };

  const handleSubmit = async (values: ModuleFormValues) => {
    if (!courseId) return toast.error("Invalid course ID");

    try {
      setLoading(true);

      const moduleData = {
        courseId,
        moduleTitle: values.moduleTitle,
        description: values.description,
      };

      await createModule(moduleData);
      toast.success("Module created successfully");
      navigate(`/instructor/course/${courseId}/modules`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <Card title="Add Module" padded className="bg-white shadow-sm rounded-lg">
        <Formik
          initialValues={{
            moduleTitle: "",
            description: "",
          }}
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
                    <Loader2 className="animate-spin w-4 h-4" />
                    Creating...
                  </div>
                ) : (
                  "Create Module"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default AddModulePage;
