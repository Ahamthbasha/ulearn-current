import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { Button } from "../../../components/common/Button";
import {
  getModuleById,
  updateModule,
} from "../../../api/action/InstructorActionApi";
import { AxiosError } from "axios";

const textOnlyRegex = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

const moduleSchema = Yup.object().shape({
  moduleTitle: Yup.string()
    .transform((value) => value?.trim())
    .required("Module title is required")
    .matches(
      textOnlyRegex,
      "Module title must contain only letters and single spaces"
    )
    .min(5, "Module title must be at least 5 characters long")
    .max(50, "Module title should not exceed 50 characters"),

  description: Yup.string()
    .transform((value) => value?.trim())
    .required("Description is required")
    .matches(
      textOnlyRegex,
      "Description must contain only letters and single spaces"
    )
    .min(10, "Description must be at least 10 characters long")
    .max(100, "Description should not exceed 100 characters"),

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

const EditModulePage = () => {
  const { courseId, moduleId } = useParams<{
    courseId: string;
    moduleId: string;
  }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    moduleTitle: "",
    description: "",
    moduleNumber: "" as unknown as number,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const data = await getModuleById(moduleId!);
        if (!data) return toast.error("Module not found");

        setInitialValues({
          moduleTitle: data.moduleTitle || "",
          description: data.description || "",
          moduleNumber: data.moduleNumber || ("" as unknown as number),
        });
      } catch {
        toast.error("Failed to load module");
      }
    };

    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  const handleSubmit = async (values: typeof initialValues) => {
    if (!moduleId) return toast.error("Invalid request");

    try {
      setLoading(true);

      const moduleData = {
        moduleTitle: values.moduleTitle.trim(),
        moduleNumber: values.moduleNumber,
        description: values.description.trim(),
      };

      await updateModule(moduleId, moduleData);
      toast.success("Module updated successfully");
      navigate(`/instructor/course/${courseId}/modules`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message =
          error?.response?.data?.message || "Failed to update module";
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
      <Card
        title="Edit Module"
        padded
        className="bg-white shadow-sm rounded-lg"
      >
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
                placeholder="e.g., Learn React fundamentals"
              />
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