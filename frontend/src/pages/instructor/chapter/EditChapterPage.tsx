import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Loader2 } from "lucide-react";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { Button } from "../../../components/common/Button";
import { getChapterById, updateChapter } from "../../../api/action/InstructorActionApi";
import { AxiosError } from "axios";

const textOnlyRegex = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/mpeg",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/ogg",
  "video/3gpp",
  "video/x-ms-wmv",
  "video/x-flv"
];

// Allowed video extensions
const ALLOWED_VIDEO_EXTENSIONS = [".mp4", ".mpeg", ".mov", ".avi", ".mkv", ".webm", ".ogg", ".3gp", ".wmv", ".flv"];

const validateTextOnly = (value: string | undefined): boolean => {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/\d/.test(trimmed)) return false;
  if (/[^A-Za-z\s]/.test(trimmed)) return false;
  if (!textOnlyRegex.test(trimmed)) return false;
  return true;
};

const chapterSchema = Yup.object().shape({
  chapterTitle: Yup.string()
    .transform((value) => value?.trim())
    .required("Chapter title is required")
    .test("valid-format", "Chapter title must contain only letters and single spaces", validateTextOnly)
    .min(5, "Chapter title must be at least 5 characters long")
    .max(50, "Chapter title should not exceed 50 characters"),

  description: Yup.string()
    .transform((value) => value?.trim())
    .required("Description is required")
    .test("valid-format", "Description must contain only letters and single spaces", validateTextOnly)
    .min(10, "Description must be at least 10 characters long")
    .max(100, "Description should not exceed 100 characters"),
});

// Helper function to validate video file
const isValidVideoFile = (file: File): { isValid: boolean; error?: string } => {
  // Check MIME type
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid video format. Allowed formats: ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}`
    };
  }

  // Check file extension
  const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.includes(fileExtension)) {
    return {
      isValid: false,
      error: `Invalid file extension. Allowed extensions: ${ALLOWED_VIDEO_EXTENSIONS.join(", ")}`
    };
  }

  // Check file size (max 500MB)
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "Video file size must be less than 500MB"
    };
  }

  return { isValid: true };
};

export interface ChapterData {
  chapterTitle: string;
  description: string;
  chapterNumber: number;
  videoUrl: string;
  duration: number;
}

const EditChapterPage = () => {
  const { moduleId, chapterId } = useParams<{ moduleId: string; chapterId: string }>();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState({
    chapterTitle: "",
    description: "",
  });

  const [currentChapterNumber, setCurrentChapterNumber] = useState<number>(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string>("");
  const [existingDuration, setExistingDuration] = useState<number>(0);
  const [newDuration, setNewDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string>("");

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      try {
        const data = await getChapterById(chapterId);
        if (!data) return toast.error("Chapter not found");

        setInitialValues({
          chapterTitle: data.chapterTitle || "",
          description: data.description || "",
        });
        setCurrentChapterNumber(data.chapterNumber || 0);
        setExistingDuration(data.duration || 0);

        if (data.videoUrl) {
          setExistingVideoUrl(data.videoUrl);
        }
      } catch {
        toast.error("Failed to load chapter");
      }
    };
    fetchChapter();
  }, [chapterId]);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Clear previous validation error and preview
    setValidationError("");
    setVideoPreview(null);
    setVideoFile(null);
    setNewDuration(0);
    
    if (!file) return;

    // Validate video file
    const validation = isValidVideoFile(file);
    if (!validation.isValid) {
      setValidationError(validation.error || "Invalid video file");
      toast.error(validation.error || "Invalid video file");
      e.target.value = "";
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreview(url);

    // Extract duration
    const video = document.createElement("video");
    video.src = url;
    video.onloadedmetadata = () => {
      const dur = Math.ceil(video.duration);
      setNewDuration(dur);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      toast.error("Failed to read video duration");
      setNewDuration(0);
      setValidationError("Failed to read video duration");
    };
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (values: typeof initialValues) => {
    if (!chapterId || !moduleId) return toast.error("Invalid request");

    if (videoFile && newDuration === 0) {
      toast.error("Failed to extract video duration. Please try another video file.");
      return;
    }

    // Re-validate video if a new one is selected
    if (videoFile) {
      const validation = isValidVideoFile(videoFile);
      if (!validation.isValid) {
        toast.error(validation.error || "Invalid video file");
        return;
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("chapterTitle", values.chapterTitle.trim());
      formData.append("description", values.description.trim());
      formData.append("chapterNumber", String(currentChapterNumber));

      if (videoFile) {
        formData.append("video", videoFile);
        formData.append("duration", String(newDuration));
      }

      await updateChapter(chapterId, formData);
      toast.success("Chapter updated successfully");
      navigate(`/instructor/modules/${moduleId}/chapters`);
    } catch (error: unknown) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message || "Failed to update chapter"
        : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-6">
      <Card title="Edit Chapter" padded className="bg-white shadow-sm rounded-lg">
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Chapter Number</label>
                <div className="mt-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                  {currentChapterNumber}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video File</label>

                {existingVideoUrl && !videoPreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Current Video:</p>
                    <video 
                      src={existingVideoUrl} 
                      controls 
                      className="w-full max-h-96 rounded shadow-md"
                    />
                    {existingDuration > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ Duration: {formatDuration(existingDuration)}
                      </p>
                    )}
                  </div>
                )}

                {videoPreview && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">New Video Preview:</p>
                    <video 
                      src={videoPreview} 
                      controls 
                      className="w-full max-h-96 rounded shadow-md"
                    />
                    {newDuration > 0 && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ New Duration: {formatDuration(newDuration)}
                      </p>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  accept={ALLOWED_VIDEO_TYPES.join(",")}
                  onChange={handleVideoChange}
                  className="w-full px-4 py-2 border rounded bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep the existing video
                </p>
                <p className="text-xs text-gray-500">
                  Allowed formats: {ALLOWED_VIDEO_EXTENSIONS.join(", ")} (Max size: 500MB)
                </p>
                {validationError && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {validationError}
                  </p>
                )}
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