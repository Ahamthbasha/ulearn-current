import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { createChapter, getChaptersByModule } from "../../../api/action/InstructorActionApi";
import { Button } from "../../../components/common/Button";
import { Loader2 } from "lucide-react";

const textOnlyRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

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

const chapterSchema = Yup.object().shape({
  chapterTitle: Yup.string()
    .transform((value) => value.trim())
    .min(5, "Chapter title must be at least 5 characters long")
    .max(50, "Title should not exceed 50 characters")
    .matches(textOnlyRegex, "Chapter title must contain only letters and single spaces")
    .test("not-blank", "Chapter title cannot be only spaces", (value) => !!value && value.trim().length >= 5)
    .required("Chapter title is required"),

  description: Yup.string()
    .transform((value) => value.trim())
    .min(10, "Description must be at least 10 characters long")
    .max(100, "Chapter description should not exceed 100 characters")
    .matches(textOnlyRegex, "Description must contain only letters and single spaces")
    .test("not-blank", "Description cannot be only spaces", (value) => !!value && value.trim().length >= 10)
    .required("Description is required"),
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

const AddChapterPage = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [nextChapterNumber, setNextChapterNumber] = useState<number>(1);
  const [validationError, setValidationError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);

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
    
    // Clear previous validation error and preview
    setValidationError("");
    setVideoPreview(null);
    setVideoFile(null);
    setDuration(0);
    
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
      setDuration(dur);
      URL.revokeObjectURL(url);
    };
    video.onerror = () => {
      toast.error("Failed to read video duration");
      setDuration(0);
      setValidationError("Failed to read video duration");
    };
  };

  const getErrorMessage = (error: unknown): string => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      error.response &&
      typeof error.response === "object" &&
      "data" in error.response
    ) {
      const data = error.response.data;

      if (data && typeof data === "object" && "message" in data && typeof data.message === "string") {
        return data.message;
      }

      if (typeof data === "string") {
        return data;
      }
    }

    return error instanceof Error ? error.message : "Chapter creation failed";
  };

  const handleSubmit = async (values: { chapterTitle: string; description: string }) => {
    if (!moduleId) return toast.error("Invalid module ID");
    
    if (!videoFile) {
      toast.error("Please select a video file.");
      return;
    }
    
    if (duration === 0) {
      toast.error("Failed to extract video duration. Please try another video file.");
      return;
    }

    // Re-validate video before submission
    const validation = isValidVideoFile(videoFile);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid video file");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("chapterTitle", values.chapterTitle);
      formData.append("description", values.description);
      formData.append("chapterNumber", String(nextChapterNumber));
      formData.append("moduleId", moduleId);
      formData.append("video", videoFile);
      formData.append("duration", String(duration));

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
          initialValues={{ chapterTitle: "", description: "" }}
          validationSchema={chapterSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField name="chapterTitle" label="Chapter Title" useFormik />
              <InputField name="description" label="Description" useFormik />

              <div>
                <label className="block text-sm font-medium text-gray-700">Chapter Number (Auto)</label>
                <div className="mt-1 px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm text-gray-700">
                  {nextChapterNumber}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Video File *</label>
                <input
                  type="file"
                  accept={ALLOWED_VIDEO_TYPES.join(",")}
                  onChange={handleVideoChange}
                  className="w-full px-4 py-2 mt-1 border rounded bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Allowed formats: {ALLOWED_VIDEO_EXTENSIONS.join(", ")} (Max size: 500MB)
                </p>
                {validationError && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ {validationError}
                  </p>
                )}
              </div>

              {videoPreview && (
                <div className="mt-2">
                  <video 
                    ref={videoRef} 
                    controls 
                    src={videoPreview} 
                    className="w-full max-h-96 rounded"
                  />
                  {duration > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading || !videoFile || duration === 0}>
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