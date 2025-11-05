// pages/instructor/chapters/AddChapterPage.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { createChapter, getChaptersByModule } from "../../../api/action/InstructorActionApi";
import { Button } from "../../../components/common/Button";
import { Loader2 } from "lucide-react";
import type { ChapterFormValues } from "../interface/instructorInterface";

const textOnlyRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const chapterSchema = Yup.object().shape({
  chapterTitle: Yup.string()
    .transform((value) => value.trim())
    .min(5, "Chapter title must be at least 5 characters long")
    .max(50, "Title should not exceed 50 characters")
    .matches(
      textOnlyRegex,
      "Chapter title must contain only letters and single spaces"
    )
    .test(
      "not-blank",
      "Chapter title cannot be only spaces",
      (value) => !!value && value.trim().length >= 5
    )
    .required("Chapter title is required"),

  description: Yup.string()
    .transform((value) => value.trim())
    .min(10, "Description must be at least 10 characters long")
    .max(100, "chapter description should not exceed 100 characters")
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
});

const AddChapterPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [nextChapterNumber, setNextChapterNumber] = useState<number>(1);

  // Fetch next chapter number
  useEffect(() => {
    const fetchNextNumber = async () => {
      if (!moduleId) return;
      try {
        const res = await getChaptersByModule(moduleId, 1, 1, "");
        const lastChapter = res.data[0];
        setNextChapterNumber((lastChapter?.chapterNumber || 0) + 1);
      } catch {
        toast.error("Failed to load chapter count");
      }
    };
    fetchNextNumber();
  }, [moduleId]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Only video files are allowed.");
      e.target.value = "";
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

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
    return error instanceof Error ? error.message : "Chapter creation failed";
  };

  const handleSubmit = async (values: Omit<ChapterFormValues, "chapterNumber">) => {
    if (!moduleId) return toast.error("Invalid module ID");
    if (!videoFile) return toast.error("Video file is required.");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("chapterTitle", values.chapterTitle);
      formData.append("description", values.description);
      formData.append("chapterNumber", String(nextChapterNumber));
      formData.append("moduleId", moduleId);
      formData.append("video", videoFile);

      await createChapter(formData);
      toast.success("Chapter created successfully");
      navigate(`/instructor/modules/${moduleId}/chapters`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <Card title="Add Chapter" padded className="bg-white shadow-sm rounded-lg">
        <Formik
          initialValues={{
            chapterTitle: "",
            description: "",
          }}
          validationSchema={chapterSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField name="chapterTitle" label="Chapter Title" useFormik />
              <InputField name="description" label="Description" useFormik />

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Chapter Number (Auto)
                </label>
                <div className="mt-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                  {nextChapterNumber}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-incremented. Reorder later if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Video File *
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-4 py-2 mt-1 border rounded bg-gray-100"
                />
              </div>

              {videoPreview && (
                <div className="mt-2">
                  <video
                    controls
                    src={videoPreview}
                    className="w-full max-h-96 rounded"
                  />
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" />
                    Uploading...
                  </div>
                ) : (
                  "Create Chapter"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default AddChapterPage;