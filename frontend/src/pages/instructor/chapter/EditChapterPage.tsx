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
  getChapterById,
  updateChapter,
} from "../../../api/action/InstructorActionApi";
import { AxiosError } from "axios";

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

  chapterNumber: Yup.number()
    .transform((value, originalValue) => {
      // Convert empty string to undefined so Yup treats it as missing
      return originalValue === "" ? undefined : value;
    })
    .typeError("Chapter number must be a valid number")
    .positive("Chapter number must be a positive value")
    .integer("Chapter number must be an integer")
    .min(1, "Chapter number must be at least 1")
    .max(250, "Chapter number must not exceed 250")
    .required("Chapter number is required"),
});

const EditChapterPage = () => {
  const { courseId, chapterId } = useParams<{
    courseId: string;
    chapterId: string;
  }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    chapterTitle: "",
    description: "",
    chapterNumber: "" as unknown as number,
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChapter = async () => {
      try {
        const data = await getChapterById(courseId!, chapterId!);
        if (!data) return toast.error("Chapter not found");

        setInitialValues({
          chapterTitle: data.chapterTitle || "",
          description: data.description || "",
          chapterNumber: data.chapterNumber || ("" as unknown as number),
        });

        if (data.videoPresignedUrl) {
          setExistingVideoUrl(data.videoPresignedUrl);
        }
      } catch {
        toast.error("Failed to load chapter");
      }
    };

    if (chapterId && courseId) {
      fetchChapter();
    }
  }, [chapterId, courseId]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const isVideo = file.type.startsWith("video/");

    if (!isVideo) {
      toast.error("Only video files are allowed.");
      e.target.value = "";
      setVideoFile(null);
      setVideoPreview(null);
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!courseId || !chapterId) return toast.error("Invalid request");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("chapterTitle", values.chapterTitle.trim());
      formData.append("description", values.description.trim());
      formData.append("chapterNumber", String(values.chapterNumber));
      formData.append("courseId", courseId);
      if (videoFile) formData.append("video", videoFile);

      await updateChapter(courseId, chapterId, formData);
      toast.success("Chapter updated successfully");
      navigate(`/instructor/course/${courseId}/chapters`);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message =
          error?.response?.data?.message || "Failed to update chapter";
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
        title="Edit Chapter"
        padded
        className="bg-white shadow-sm rounded-lg"
      >
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={chapterSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField name="chapterTitle" label="Chapter Title" useFormik />
              <InputField name="description" label="Description" useFormik />
              <InputField
                name="chapterNumber"
                label="Chapter Number"
                type="number"
                placeholder="Enter chapter number"
                useFormik
              />

              {/* Video File Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File
                </label>

                {/* Show Existing Video */}
                {existingVideoUrl && !videoPreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Current Video:</p>
                    <video
                      src={existingVideoUrl}
                      controls
                      muted={false}
                      className="w-full max-h-96 rounded shadow-md"
                    />
                  </div>
                )}

                {/* Show New Video Preview */}
                {videoPreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">New Video Preview:</p>
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-96 rounded shadow-md"
                    />
                  </div>
                )}

                {/* File Input */}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-4 py-2 border rounded bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep the existing video
                </p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin h-4 w-4" />
                    Saving...
                  </div>
                ) : (
                  "Update Chapter"
                )}
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  );
};

export default EditChapterPage;