import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import {
  getCategoryById,
  editCategory,
} from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";

const EditCategoryPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({ name: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await getCategoryById(categoryId!);

        if (response?.success && response?.data) {
          setInitialValues({ name: response.data.categoryName });
        } else {
          toast.error(response?.data?.message);
        }
      } catch (err) {
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">Edit Category</h1>

      {loading ? (
        <p>Loading category details...</p>
      ) : (
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={Yup.object({
            name: Yup.string()
              .required("Category name is required")
              .min(5, "Category name must be at least 5 characters")
              .max(30, "Category name must not exceed 30 characters")
              .test(
                "is-valid-category",
                "Must contain at least 5 alphabet letters (no only numbers/symbols)",
                (value) => {
                  if (!value) return false;
                  const trimmed = value.trim();
                  // Count alphabetic characters
                  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
                  // Ensure at least 5 letters and not only numbers/symbols
                  const hasLetters = /[a-zA-Z]/.test(trimmed);
                  const notOnlySymbolsOrDigits = /[a-zA-Z]/.test(trimmed);
                  return letterCount >= 5 && hasLetters && notOnlySymbolsOrDigits;
                }
              ),
          })}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const response = await editCategory(categoryId!, values.name);
              if (response.success) {
                toast.success("Category updated successfully");
                navigate("/admin/category");
              } else {
                toast.error(response.message || "Failed to update category");
              }
            } catch (err: any) {
              const message = err?.response?.data?.message;
              toast.error(message);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6 bg-white p-6 rounded-lg shadow">
              <InputField
                name="name"
                label="Category Name"
                placeholder="Eg: Web Development"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                {isSubmitting ? "Updating..." : "Update Category"}
              </button>
            </Form>
          )}
        </Formik>
      )}
    </div>
  );
};

export default EditCategoryPage;