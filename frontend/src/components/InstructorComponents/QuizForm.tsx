import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../common/Button";

export interface SingleQuestionFormValues {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Props {
  initialValues: SingleQuestionFormValues;
  onSubmit: (values: SingleQuestionFormValues) => void;
  buttonLabel?: string;
  formTitle?: string;
}

const strongTextRegex = /^(?!.*(.)\1{9,})(?=.*[a-zA-Z])(?=.*[\s\d]).{10,}$/;

const validationSchema = Yup.object().shape({
  questionText: Yup.string()
    .trim()
    .min(10, "Question must be at least 10 characters long")
    .matches(strongTextRegex, "Question must be meaningful (not just repeated letters)")
    .required("Question text is required"),

  options: Yup.array()
    .of(
      Yup.string()
        .trim()
        .min(5, "Option must be at least 10 characters long")
        .matches(strongTextRegex, "Option must be meaningful")
        .required("Option is required")
    )
    .min(2, "At least 2 options are required"),

  correctAnswer: Yup.string()
    .trim()
    .min(5, "Correct answer must be at least 10 characters long")
    .matches(strongTextRegex, "Correct answer must be meaningful")
    .required("Correct answer is required"),
});

const SingleQuestionForm: React.FC<Props> = ({
  initialValues,
  onSubmit,
  buttonLabel = "Add Question",
  formTitle,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize
    >
      <Form className="space-y-6 max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {formTitle ?? (buttonLabel === "Update Question" ? "✏️ Edit Question" : "📝 Add a New Question")}
        </h2>

        {/* Question */}
        <div>
          <label className="block text-md font-semibold text-gray-700 mb-2">Question</label>
          <Field
            name="questionText"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Type your question here..."
          />
          <ErrorMessage name="questionText" component="p" className="text-red-500 text-sm mt-1" />
        </div>

        {/* Options */}
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i}>
              <label className="block text-md font-semibold text-gray-700 mb-1">Option {i + 1}</label>
              <Field
                name={`options[${i}]`}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder={`Enter option ${i + 1}`}
              />
              <ErrorMessage name={`options[${i}]`} component="p" className="text-red-500 text-sm mt-1" />
            </div>
          ))}
        </div>

        {/* Correct Answer */}
        <div>
          <label className="block text-md font-semibold text-gray-700 mb-2">Correct Answer</label>
          <Field
            name="correctAnswer"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="Type the correct answer"
          />
          <ErrorMessage name="correctAnswer" component="p" className="text-red-500 text-sm mt-1" />
        </div>

        {/* Submit */}
        <div className="pt-6 text-right">
          <Button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition duration-200 shadow-md"
          >
            {buttonLabel}
          </Button>
        </div>
      </Form>
    </Formik>
  );
};

export default SingleQuestionForm;
