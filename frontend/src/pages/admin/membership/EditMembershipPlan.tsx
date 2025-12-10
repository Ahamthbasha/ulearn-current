import { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useParams, useNavigate } from "react-router-dom";
import InputField from "../../../components/common/InputField";
import {
  getMembershipById,
  editMembership,
} from "../../../api/action/AdminActionApi";
import { toast } from "react-toastify";
import { type FormHelpers, type FormValues } from "../interface/adminInterface";
import type { AxiosError } from "axios";

const validationSchema = Yup.object().shape({
  name: Yup.string()
    .required("Plan name is required")
    .max(50, "Plan name must not exceed 50 characters")
    .matches(
      /^[A-Za-z][A-Za-z0-9\s&-]{2,}$/,
      "Plan name must start with a letter and contain only letters, numbers, spaces, hyphens, or ampersands"
    )
    .test(
      "min-letters",
      "Plan name must contain at least 5 alphabet letters",
      (value) => {
        if (!value) return false;
        const letterCount = (value.match(/[A-Za-z]/g) || []).length;
        return letterCount >= 5;
      }
    )
    .test(
      "not-only-symbols-or-numbers",
      "Plan name cannot contain only numbers or symbols",
      (value) => {
        return !!value && /[A-Za-z]/.test(value); // Must contain at least one alphabet
      }
    ),

  durationInDays: Yup.number()
    .typeError("Duration must be a number")
    .required("Duration is required")
    .min(30, "Minimum duration is 30 days")
    .max(365,"Maximum one year"),

  price: Yup.number()
    .typeError("Price must be a number")
    .required("Price is required")
    .min(100, "Price must be at least ₹100")
    .max(100000,"price maximum will be ₹100000"),
    

  description: Yup.string()
    .required("Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(300, "Description must not exceed 300 characters")
    .matches(
      /^[A-Za-z\s]+$/,
      "Description must contain only letters and spaces"
    )
    .test(
      "min-letters",
      "Description must contain at least 5 alphabet letters",
      (value) => {
        if (!value) return false;
        const letterCount = (value.match(/[A-Za-z]/g) || []).length;
        return letterCount >= 5;
      }
    ),

  benefits: Yup.string()
    .required("At least one benefit is required")
    .test(
      "valid-benefits",
      "Each benefit must contain at least 5 alphabet letters and only letters/spaces",
      (value) => {
        if (!value) return false;
        const benefits = value.split(",").map((b) => b.trim());
        return benefits.every((b) => {
          if (!/^[A-Za-z\s]{3,}$/.test(b)) return false;
          const letterCount = (b.match(/[A-Za-z]/g) || []).length;
          return letterCount >= 5;
        });
      }
    ),
});

const EditMembershipPlanPage = () => {
  const { membershipId } = useParams();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      if (!membershipId) return;
      const response = await getMembershipById(membershipId);
      const plan = response.plan;
      console.log(plan);
      setInitialValues({
        name: plan.name,
        durationInDays: plan.durationInDays.toString(),
        price: plan.price.toString(),
        description: plan.description || "",
        benefits: (plan.benefits || []).join(", "),
      });
    } catch (err) {
      toast.error("Failed to load membership plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [membershipId]);

const handleSubmit = async (
  values: FormValues,
  { setSubmitting, setFieldError }: FormHelpers
) => {
  try {
    if (!membershipId) return;

    const payload = {
      name: values.name,
      durationInDays: Number(values.durationInDays),
      price: Number(values.price),
      description: values.description || undefined,
      benefits: values.benefits
        ? values.benefits
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [],
    };

    const response = await editMembership(membershipId, payload);

    console.log("edit membership", response);
    toast.success("Membership plan updated");
    navigate("/admin/membership");
  } catch (err: unknown) {
    let message = "Failed to update membership plan";

    if (err && typeof err === "object" && "response" in err) {
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      message = axiosErr.response?.data?.message || message;

      const errorText = axiosErr.response?.data?.error;

      if (message.includes("already exists") || errorText?.includes("already exists")) {
        setFieldError("name", errorText || message);
        setSubmitting(false);
        return;
      }
    }

    toast.error(message);
  } finally {
    setSubmitting(false);
  }
};

  if (loading || !initialValues) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-gray-600">
        Loading membership plan...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">
        Edit Membership Plan
      </h2>

      <Formik
        initialValues={initialValues}
        enableReinitialize
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting }) => (
          <Form className="space-y-4">
            <InputField
              name="name"
              label="Plan Name"
              placeholder="Enter plan name"
            />
            <InputField
              name="durationInDays"
              label="Duration (Days)"
              type="number"
              placeholder="e.g. 30"
            />
            <InputField
              name="price"
              label="Price (₹)"
              type="number"
              placeholder="e.g. 499"
            />
            <InputField
              name="description"
              label="Description"
              placeholder="Enter description"
            />
            <InputField
              name="benefits"
              label="Benefits (comma separated)"
              placeholder="e.g. Access to premium courses, Priority support"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg text-white font-semibold transition ${
                isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Plan"}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditMembershipPlanPage;