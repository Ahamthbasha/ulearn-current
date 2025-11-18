import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getSpecificCourse,
  markChapterAsCompleted,
  submitQuiz,
} from "../../../api/action/StudentAction";
import { toast } from "react-toastify";
import {
  Play,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Unlock,
  Clock,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import defaultAvatar from "../../../assets/defaultAvatar.jpg";
import ReviewModal from "../../../components/StudentComponents/ReviewModal"; 
import type { EnrollmentResponse, Module } from "../interface/enrollmentDetailInterface";

const EnrolledCourseDetailPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [enrollment, setEnrollment] = useState<EnrollmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasShownReviewModal, setHasShownReviewModal] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const markTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = (user?.name || "Guest").toUpperCase();
  const learningPathId = location.state?.learningPathId;

  const fetchEnrollment = useCallback(async () => {
    try {
      const res = await getSpecificCourse(courseId!);
      setEnrollment(res.mappedResponse);
      return res.mappedResponse;
    } catch (err) {
      toast.error("Failed to load course");
      throw err;
    }
  }, [courseId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await fetchEnrollment();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [fetchEnrollment]);

  // Trigger review modal when course is 100% complete
  useEffect(() => {
    if (
      enrollment &&
      enrollment.completionPercentage === 100 &&
      !hasShownReviewModal
    ) {
      setShowReviewModal(true);
      setHasShownReviewModal(true);
    }
  }, [enrollment?.completionPercentage, hasShownReviewModal]);

  const currentModule = enrollment?.course.modules[selectedModuleIdx];
  const currentChapter = currentModule?.chapters[selectedChapterIdx];
  const currentQuiz = currentModule?.quiz;

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || showQuiz || !currentChapter || currentChapter.isCompleted) return;

    const progress = (video.currentTime / video.duration) * 100;

    if (progress >= 100) {
      if (markTimeoutRef.current) return;

      markTimeoutRef.current = setTimeout(async () => {
        try {
          await markChapterAsCompleted(courseId!, currentChapter.id);
          await fetchEnrollment();
          toast.success("Chapter completed!");
        } catch (err) {
          toast.error("Failed to mark chapter");
        } finally {
          markTimeoutRef.current = null;
        }
      }, 800);
    }
  }, [showQuiz, currentChapter, courseId, fetchEnrollment]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || showQuiz) return;

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      if (markTimeoutRef.current) clearTimeout(markTimeoutRef.current);
    };
  }, [handleTimeUpdate, showQuiz]);

  const handleQuizAnswer = (qIndex: number, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [qIndex]: answer }));
  };

  const handleQuizSubmit = async () => {
    if (!currentQuiz || !enrollment) return;

    const unanswered = currentQuiz.questions
      .map((_, i) => i)
      .filter(i => !quizAnswers[i]);

    if (unanswered.length > 0) {
      toast.error(`Please answer question ${unanswered.map(i => i + 1).join(", ")}`);
      return;
    }

    let correct = 0;
    currentQuiz.questions.forEach((q, i) => {
      if (quizAnswers[i] === q.correctAnswer) correct++;
    });

    const percentage = Math.round((correct / currentQuiz.questions.length) * 100);

    try {
      setSubmitting(true);
      await submitQuiz({
        courseId: courseId!,
        quizId: currentQuiz.id,
        correctAnswers: correct,
        totalQuestions: currentQuiz.questions.length,
        percentage,
      });

      toast.success(`Quiz submitted! Score: ${percentage}%`);
      setShowQuiz(false);
      setQuizAnswers({});
      await fetchEnrollment();
    } catch (err) {
      toast.error("Quiz submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleModule = (idx: number) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };

  const goToChapter = (modIdx: number, chapIdx: number) => {
    setSelectedModuleIdx(modIdx);
    setSelectedChapterIdx(chapIdx);
    setShowQuiz(false);
    setSidebarOpen(false);
  };

  const goToNext = () => {
    if (!enrollment) return;
    const mod = enrollment.course.modules[selectedModuleIdx];
    if (!mod) return;

    if (selectedChapterIdx < mod.chapters.length - 1) {
      setSelectedChapterIdx(prev => prev + 1);
    } else if (selectedModuleIdx < enrollment.course.modules.length - 1) {
      const nextIdx = selectedModuleIdx + 1;
      setSelectedModuleIdx(nextIdx);
      setSelectedChapterIdx(0);
      setExpandedModules(prev => new Set(prev).add(nextIdx));
    }
    setShowQuiz(false);
  };

  const goToPrev = () => {
    if (selectedChapterIdx > 0) {
      setSelectedChapterIdx(prev => prev - 1);
    } else if (selectedModuleIdx > 0) {
      const prevIdx = selectedModuleIdx - 1;
      setSelectedModuleIdx(prevIdx);
      const prevMod = enrollment?.course.modules[prevIdx];
      setSelectedChapterIdx(prevMod?.chapters.length ? prevMod.chapters.length - 1 : 0);
      setExpandedModules(prev => new Set(prev).add(prevIdx));
    }
    setShowQuiz(false);
  };

  const areAllChaptersCompletedInModule = (module: Module) => {
    return module.chapters.every(ch => ch.isCompleted);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading your course...</p>
        </div>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <p className="text-xl text-gray-700 mb-4">Course not found</p>
        <button
          onClick={() => navigate(learningPathId ? `/user/enrolledLms/${learningPathId}` : "/user/enrolled")}
          className="text-purple-600 hover:underline"
        >
          Back to Courses
        </button>
      </div>
    );
  }

  const { course } = enrollment;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <h1 className="text-xl font-bold text-gray-900 truncate max-w-xs lg:max-w-none">
              {course.title}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="hidden sm:block text-sm text-gray-600">
              {enrollment.completionPercentage}% Complete
            </span>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                style={{ width: `${enrollment.completionPercentage}%` }}
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">{username}</span>
              <img
                src={defaultAvatar}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } bg-white shadow-lg transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p>{course.totalLectures} lectures • {course.totalQuizzes} quizzes</p>
              <p>{course.duration} total length</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {course.modules.map((module, modIdx) => {
              const isExpanded = expandedModules.has(modIdx);
              const allChaptersCompleted = areAllChaptersCompletedInModule(module);
              const quizPassed = module.quiz?.isPassed;

              return (
                <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleModule(modIdx)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                      selectedModuleIdx === modIdx
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-900 hover:from-gray-100 hover:to-gray-200"
                    } font-medium`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{module.position}. {module.title}</span>
                      {allChaptersCompleted && <CheckCircle className="w-4 h-4" />}
                      {quizPassed && <Award className="w-4 h-4" />}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs opacity-75">{module.duration}</span>
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-white">
                      {module.chapters.map((chapter, chapIdx) => (
                        <div
                          key={chapter.id}
                          onClick={() => goToChapter(modIdx, chapIdx)}
                          className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-all hover:bg-purple-50 border-b border-gray-100 ${
                            selectedModuleIdx === modIdx && selectedChapterIdx === chapIdx && !showQuiz
                              ? "bg-purple-100"
                              : ""
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {chapter.isCompleted ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Play className="w-4 h-4 text-gray-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {chapter.position}. {chapter.title}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {chapter.duration}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {module.quiz && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!allChaptersCompleted) {
                              toast.warning("Complete all chapters in this module to unlock the quiz!");
                              return;
                            }
                            setShowQuiz(true);
                            setSidebarOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${
                            allChaptersCompleted
                              ? quizPassed
                                ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!allChaptersCompleted}
                        >
                          <span className="flex items-center space-x-2">
                            {quizPassed ? (
                              <Award className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">Quiz: {module.title}</span>
                          </span>
                          {quizPassed && <span className="text-xs">{module.quiz.scorePercentage}%</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto p-4 lg:p-8">
            {showQuiz && currentQuiz ? (
              <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Module Quiz</h2>
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                  {currentQuiz.questions.map((q, idx) => (
                    <div key={idx} className="border-b pb-6 last:border-0">
                      <p className="text-lg font-semibold text-gray-800 mb-4">
                        {idx + 1}. {q.questionText}
                      </p>
                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer transition-all"
                          >
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              value={opt}
                              checked={quizAnswers[idx] === opt}
                              onChange={() => handleQuizAnswer(idx, opt)}
                              className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                            />
                            <span className="text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Quiz</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Video Player */}
                <div className="bg-black rounded-xl overflow-hidden shadow-xl mb-6">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full aspect-video"
                    src={currentChapter?.videoUrl}
                    poster={course.thumbnail}
                    key={currentChapter?.id}
                  >
                    Your browser does not support video.
                  </video>
                </div>

                {/* Chapter Info */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentChapter?.title}
                  </h1>
                  <p className="text-sm text-gray-600 mb-4">
                    Module {selectedModuleIdx + 1} • Chapter {selectedChapterIdx + 1} of{" "}
                    {currentModule?.chapters.length}
                  </p>

                  {currentChapter?.isCompleted ? (
                    <p className="text-green-600 font-medium flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Chapter Completed
                    </p>
                  ) : (
                    <p className="text-purple-600 text-sm flex items-center">
                      <Play className="w-4 h-4 mr-1" />
                      Watch 100% to auto-complete
                    </p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={goToPrev}
                    disabled={selectedModuleIdx === 0 && selectedChapterIdx === 0}
                    className="flex items-center space-x-2 px-5 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous</span>
                  </button>

                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {enrollment.completionPercentage}% Course Complete
                    </p>
                  </div>

                  <button
                    onClick={goToNext}
                    disabled={
                      selectedModuleIdx === course.modules.length - 1 &&
                      selectedChapterIdx === currentModule!.chapters.length - 1
                    }
                    className="flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        courseId={courseId!}
        courseTitle={course.title}
        completionPercentage={enrollment.completionPercentage}
        onReviewSubmitted={() => {
          fetchEnrollment();
        }}
      />
    </div>
  );
};

export default EnrolledCourseDetailPage;