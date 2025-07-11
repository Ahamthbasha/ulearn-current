import { Formik, Form } from "formik";
import * as Yup from "yup";
import InputField from "../../../components/common/InputField";
import { addCategory } from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const AddCategoryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-blue-600 mb-6">Add New Category</h1>
      <Formik
  initialValues={{ name: "" }}
validationSchema={Yup.object({
  name: Yup.string()
    .required("Category name is required")
    .test(
      "is-valid-category",
      "Must be at least 5 characters with alphabet letters (no only numbers/symbols)",
      (value) => {
        if (!value) return false;
        const trimmed = value.trim();

        // At least 5 characters, contains at least 1 alphabet, not just digits/symbols
        const hasMinLength = trimmed.length >= 5;
        const hasLetters = /[a-zA-Z]/.test(trimmed);
        const notOnlySymbolsOrDigits = /[a-zA-Z]/.test(trimmed); // Ensures there's a letter

        return hasMinLength && hasLetters && notOnlySymbolsOrDigits;
      }
    )
})}


  onSubmit={async (values, { setSubmitting }) => {
  try {
    const response = await addCategory(values.name); // ✅ Only string
    if (response.success) {
      toast.success("Category added successfully");
      navigate("/admin/category");
    } else {
      toast.error(response.message || "Failed to add category");
    }
  } catch (err: any) {
    if (err?.response?.status === 409) {
      toast.error(err.response.data.message || "Category already exists");
    } else {
      toast.error("Something went wrong");
    }
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
        placeholder="Eg: Programming"
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        {isSubmitting ? "Adding..." : "Add Category"}
      </button>
    </Form>
  )}
</Formik>
    </div>
  );
};

export default AddCategoryPage;
