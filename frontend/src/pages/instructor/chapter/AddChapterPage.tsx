import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form } from "formik";
import * as Yup from "yup";

import Card from "../../../components/common/Card";
import InputField from "../../../components/common/InputField";
import { createChapter } from "../../../api/action/InstructorActionApi";
import { Button } from "../../../components/common/Button";
import { Loader2 } from "lucide-react";
const textOnlyRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const chapterSchema = Yup.object().shape({
  chapterTitle: Yup.string()
    .transform((value) => value.trim())
    .min(5, "Chapter title must be at least 5 characters long")
    .matches(textOnlyRegex, "Chapter title must contain only letters and single spaces")
    .test(
      "not-blank",
      "Chapter title cannot be only spaces",
      (value) => !!value && value.trim().length >= 5
    )
    .required("Chapter title is required"),

  description: Yup.string()
    .transform((value) => value.trim())
    .min(10, "Description must be at least 10 characters long")
    .matches(textOnlyRegex, "Description must contain only letters and single spaces")
    .test(
      "not-blank",
      "Description cannot be only spaces",
      (value) => !!value && value.trim().length >= 10
    )
    .required("Description is required"),

  chapterNumber: Yup.number()
    .typeError("Chapter number must be a valid number")
    .positive("Chapter number must be a positive value")
    .integer("Chapter number must be an integer")
    .required("Chapter number is required"),
});

const AddChapterPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [captionFile, setCaptionFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const isVideo = file.type.startsWith("video/");

  if (!isVideo) {
    toast.error("Only video files are allowed.");
    
    // Reset the file input manually
    e.target.value = "";  // ⬅️ Clear the input
    setVideoFile(null);
    setVideoPreview(null);
    return;
  }

  // All good
  setVideoFile(file);
  setVideoPreview(URL.createObjectURL(file));
};


  const handleCaptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["vtt", "srt"].includes(ext || "")) {
      toast.error("Only .vtt or .srt files are allowed.");
      setCaptionFile(null);
      return;
    }

    setCaptionFile(file);
  };

  const handleSubmit = async (values: any) => {
    if (!courseId) return toast.error("Invalid course ID");

    if (!videoFile) {
      toast.error("Video file is required.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("chapterTitle", values.chapterTitle);
      formData.append("description", values.description);
      formData.append("chapterNumber", String(values.chapterNumber));
      formData.append("courseId", courseId);
      formData.append("video", videoFile);
      if (captionFile) formData.append("captions", captionFile);

      const res = await createChapter(courseId, formData);
      console.log('response from res',res)
      toast.success(res?.data?.message);
      navigate(`/instructor/course/${courseId}/chapters`);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message
      toast.error(message|| "Chapter creation failed");
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
            chapterNumber: "",
          }}
          validationSchema={chapterSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="space-y-4">
              <InputField name="chapterTitle" label="Chapter Title" useFormik />
              <InputField name="description" label="Description" useFormik />
              <InputField name="chapterNumber" label="Chapter Number" type="number" useFormik />

              {/* Video File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Video File *</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full px-4 py-2 mt-1 border rounded bg-gray-100"
                />
              </div>

              {/* Video Preview */}
              {videoPreview && (
                <div className="mt-2">
                  <video controls src={videoPreview} className="w-full max-h-96 rounded" />
                </div>
              )}

              {/* Caption File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Caption File (optional)</label>
                <input
                  type="file"
                  accept=".vtt,.srt"
                  onChange={handleCaptionsChange}
                  className="w-full px-4 py-2 mt-1 border rounded bg-gray-100"
                />
              </div>

              {/* Submit Button with Spinner */}
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
