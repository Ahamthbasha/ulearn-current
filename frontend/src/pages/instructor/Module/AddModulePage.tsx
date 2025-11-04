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

const textOnlyRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const moduleSchema = Yup.object().shape({
  moduleTitle: Yup.string()
    .transform((value) => value.trim())
    .min(5, "Module title must be at least 5 characters long")
    .max(50, "Title should not exceed 50 characters")
    .matches(
      textOnlyRegex,
      "Module title must contain only letters and single spaces"
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
      textOnlyRegex,
      "Description must contain only letters and single spaces"
    )
    .test(
      "not-blank",
      "Description cannot be only spaces",
      (value) => !!value && value.trim().length >= 10
    )
    .required("Description is required"),

  moduleNumber: Yup.number()
    .transform((value, originalValue) => {
      return originalValue === "" ? undefined : value;
    })
    .typeError("Module number must be a valid number")
    .positive("Module number must be a positive value")
    .integer("Module number must be an integer")
    .min(1, "Module number must be at least 1")
    .max(250, "Module number must not exceed 250")
    .required("Module number is required"),
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
        moduleNumber: values.moduleNumber,
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
            moduleNumber: "" as unknown as number,
          }}
          validationSchema={moduleSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField name="moduleTitle" label="Module Title" useFormik />
              <InputField name="description" label="Description" useFormik />
              <InputField
                name="moduleNumber"
                label="Module Number"
                type="number"
                placeholder="Enter module number"
                useFormik
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
