import { IJwtService } from "../../services/interface/IJwtService";
import { JwtService } from "../../services/jwtService";
import { SendEmail } from "../../utils/sendOtpEmail";
import { IEmail } from "../../types/Email";
import { IOtpGenerate } from "../../types/types";
import { OtpGenerate } from "../../utils/otpGenerator";
import { RedisOtpService } from "../../services/otpService";
import IOtpServices from "../../services/interface/IOtpService";

import { IStudentRepository } from "../../repositories/studentRepository/interface/IStudentRepository";
import { StudentRepository } from "../../repositories/studentRepository/studentRepository";
import { studentProfileRepository } from "../../repositories/studentRepository/studentProfileRepository";
import { IStudentProfileRepository } from "../../repositories/studentRepository/interface/IStudentProfileRepository";
import { IChapterReadOnlyRepository } from "../../repositories/interfaces/IChapterReadOnlyRepository";
import { ChapterReadOnlyRepository } from "../../repositories/studentRepository/chapterReadOnlyRepository";
import { IQuizReadOnlyRepository } from "../../repositories/interfaces/IQuizReadOnlyRepository";
import { QuizReadOnlyRepository } from "../../repositories/studentRepository/quizReadOnlyRepository";
import { IStudentCourseOfferRepository } from "../../repositories/studentRepository/interface/IStudentCourseOfferRepo";
import { StudentCourseOfferRepository } from "../../repositories/studentRepository/studentCourseOfferRepo";
import { IStudentModuleRepository } from "../../repositories/studentRepository/interface/IStudentModuleRepository";
import { StudentModuleRepository } from "../../repositories/studentRepository/studentModuleRepository";
import { ICategoryReadOnlyRepository } from "../../repositories/interfaces/ICategoryReadOnlyRepository";
import { CategoryReadOnlyRepository } from "../../repositories/studentRepository/CategoryReadOnlyRepository";
import { IStudentLmsRepo } from "../../repositories/studentRepository/interface/IStudentLmsRepo";
import { StudentLmsRepo } from "../../repositories/studentRepository/studentLmsRepo";
import { IStudentCartRepository } from "../../repositories/studentRepository/interface/IStudentCartRepository";
import { StudentCartRepository } from "../../repositories/studentRepository/studentCartRepository";
import { IStudentWishlistRepository } from "../../repositories/studentRepository/interface/IStudentWishlistRepository";
import { StudentWishlistRepository } from "../../repositories/studentRepository/studentWishlistRepository";
import { IStudentCouponRepo } from "../../repositories/studentRepository/interface/IStudentCouponRepo";
import { StudentCouponRepo } from "../../repositories/studentRepository/studentCouponRepo";
import { ILearningPathRepository } from "../../repositories/interfaces/ILearningPathRepository";

import { IStudentCheckoutRepository } from "../../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { StudentCheckoutRepository } from "../../repositories/studentRepository/studentCheckoutRepository";
import { OrderRepository } from "../../repositories/OrderRepository";
import { IEnrollmentRepository } from "../../repositories/interfaces/IEnrollmentRepository";
import { EnrollmentRepository } from "../../repositories/EnrollmentRepository";
import { ILearningPathEnrollmentRepo } from "../../repositories/interfaces/ILearningPathEnrollmentRepo";
import { LearningPathEnrollmentRepo } from "../../repositories/learningPathEnrollmentRepo";
import { CourseRepository } from "../../repositories/CourseRepository";
import { ICourseRepository } from "../../repositories/interfaces/ICourseRepository";
import { IWalletRepository } from "../../repositories/interfaces/IWalletRepository";
import { WalletRepository } from "../../repositories/WalletRepository";
import { IAdminRepository } from "../../repositories/adminRepository/interface/IAdminRepository";
import { AdminRespository } from "../../repositories/adminRepository/adminRepository";
import { IAdminUserRepository } from "../../repositories/adminRepository/interface/IAdminUserRepository";
import { AdminUserRespository } from "../../repositories/adminRepository/adminUserRepository";
import { IAdminInstructorRepository } from "../../repositories/adminRepository/interface/IAdminInstructorRepository";
import { AdminInstructorRespository } from "../../repositories/adminRepository/adminInstructorRepository";
import  IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository";
import InstructorRepository from "../../repositories/instructorRepository/instructorRepository";
import { IOrderRepository } from "../../repositories/interfaces/IOrderRepository";
import { IStudentEnrollmentRepository } from "../../repositories/studentRepository/interface/IStudentEnrollmentRepository";
import { StudentEnrollmentRepository } from "../../repositories/studentRepository/studentEnrollementRepository";
import { IStudentLmsEnrollmentRepo } from "../../repositories/studentRepository/interface/IStudentLmsEnrollmentRepo";
import { StudentLmsEnrollmentRepo } from "../../repositories/studentRepository/studentLmsEnrollmentRepo";
import { ICourseRatingRepository } from "../../repositories/interfaces/ICourseRatingRepository";
import { CourseRatingRepository } from "../../repositories/courseRatingRepository";
import { IStudentCourseReviewRepo } from "../../repositories/studentRepository/interface/IStudentCourseReviewRepo";
import { StudentCourseReviewRepo } from "../../repositories/studentRepository/studentCourseReviewRepo";
import { IStudentCourseRepository } from "../../repositories/studentRepository/interface/IStudentCourseRepository";
import { StudentCourseRepository } from "../../repositories/studentRepository/studentCourseRepository";
import { IWalletPaymentRepository } from "../../repositories/interfaces/IWalletPaymentRepository";
import { WalletPaymentRepository } from "../../repositories/walletPaymentRepository";
import { IStudentOrderRepository } from "../../repositories/studentRepository/interface/IStudentOrderRepository";
import { StudentOrderRepository } from "../../repositories/studentRepository/studentOrderRepository";
import { IStudentInstructorListingRepository } from "../../repositories/studentRepository/interface/IStudentInstructorListingRepository";
import { StudentInstructorListingRepository } from "../../repositories/studentRepository/studentInstructorListingRepository";
import { IStudentSlotRepository } from "../../repositories/studentRepository/interface/IStudentSlotRepository";
import { StudentSlotRepository } from "../../repositories/studentRepository/StudentSlotRepository";
import { IStudentSlotBookingRepository } from "../../repositories/studentRepository/interface/IStudentSlotBookingRepository";
import { StudentSlotBookingRepository } from "../../repositories/studentRepository/studentSlotBookingRepository";
import { IStudentDashboardRepository } from "../../repositories/studentRepository/interface/IStudentDashboardRepository";
import { StudentDashboardRepository } from "../../repositories/studentRepository/studentDashboardRepository";
import { BookingRepository } from "../../repositories/BookingRepository";
import { IStudentLearningPathRepository } from "../../repositories/studentRepository/interface/IStudentsideLMSRepo";
import { StudentLearningPathRepository } from "../../repositories/studentRepository/studentsideLMSRepo";

// Services
import IStudentService from "../../services/studentServices/interface/IStudentService";
import { StudentServices } from "../../services/studentServices/studentService";
import { IStudentProfileService } from "../../services/studentServices/interface/IStudentProfileService";
import { StudentProfileService } from "../../services/studentServices/studentProfileService";
import { IStudentCourseService } from "../../services/studentServices/interface/IStudentCourseService";
import { StudentCourseService } from "../../services/studentServices/studentCourseService";
import { ICategoryReadOnlyService } from "../../services/interface/ICategoryReadOnlyService";
import { CategoryReadOnlyService } from "../../services/studentServices/categoryReadOnlyService";
import { IStudentLmsService } from "../../services/studentServices/interface/IStudentLmsService";
import { StudentLmsService } from "../../services/studentServices/studentLmsService";
import { IStudentCartService } from "../../services/studentServices/interface/IStudentCartService";
import { StudentCartService } from "../../services/studentServices/studentCartService";
import { IStudentWishlistService } from "../../services/studentServices/interface/IStudentWishlistService";
import { StudentWishlistService } from "../../services/studentServices/studentWishlistService";
import { IStudentCouponService } from "../../services/studentServices/interface/IStudentCouponService";
import { StudentCouponService } from "../../services/studentServices/studentCouponService";
import { IStudentCheckoutService } from "../../services/studentServices/interface/IStudentCheckoutService";
import { StudentCheckoutService } from "../../services/studentServices/studentCheckoutService";
import { IWalletService } from "../../services/interface/IWalletService";
import { WalletService } from "../../services/walletService";
import { IStudentEnrollmentService } from "../../services/studentServices/interface/IStudentEnrollmentService";
import { StudentEnrollmentService } from "../../services/studentServices/studentEnrollmentService";
import { IStudentLmsEnrollmentService } from "../../services/studentServices/interface/IStudentLmsEnrollmentService";
import { StudentLmsEnrollmentService } from "../../services/studentServices/studentLmsEnrollmentService";
import { ICourseRatingService } from "../../services/interface/ICourseRatingService";
import { CourseRatingService } from "../../services/courseRatingService";
import { IStudentCourseReviewService } from "../../services/studentServices/interface/IStudentCourseReviewService";
import { StudentCourseReviewService } from "../../services/studentServices/studentCourseReviewService";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { WalletPaymentService } from "../../services/walletPaymentService";
import { IStudentOrderService } from "../../services/studentServices/interface/IStudentOrderService";
import { StudentOrderService } from "../../services/studentServices/studentOrderService";
import { IStudentInstructorListingService } from "../../services/studentServices/interface/IStudentInstructorListingService";
import { StudentInstructorListingService } from "../../services/studentServices/studentInstructorListingService";
import { IStudentSlotService } from "../../services/studentServices/interface/IStudentSlotService";
import { StudentSlotService } from "../../services/studentServices/studentSlotService";
import { IStudentSlotBookingService } from "../../services/studentServices/interface/IStudentSlotBookingService";
import { StudentSlotBookingService } from "../../services/studentServices/studentSlotBookingService";
import { IStudentDashboardService } from "../../services/studentServices/interface/IStudentDashboardService";
import { StudentDashboardService } from "../../services/studentServices/studentDashboardService";
import { IStudentLearningPathService } from "../../services/studentServices/interface/IStudentsideLMSService";
import { StudentLearningPathService } from "../../services/studentServices/studentsideLMSService";

// Controllers
import IStudentController from "../../controllers/studentControllers/interfaces/IStudentController";
import { StudentController } from "../../controllers/studentControllers/studentController";
import { IStudentProfileController } from "../../controllers/studentControllers/interfaces/IStudentProfileController";
import { StudentProfileController } from "../../controllers/studentControllers/studentProfileController";
import { IStudentCourseController } from "../../controllers/studentControllers/interfaces/IStudentCourseController";
import { StudentCourseController } from "../../controllers/studentControllers/studentCourseController";
import { ICategoryReadOnlyController } from "../../controllers/studentControllers/interfaces/ICategoryReadOnlyController";
import { CategoryReadOnlyController } from "../../controllers/studentControllers/CategoryReadOnlyController";
import { IStudentLmsController } from "../../controllers/studentControllers/interfaces/IStudentLmsController";
import { StudentLmsController } from "../../controllers/studentControllers/studentLmsController";
import { IStudentCartController } from "../../controllers/studentControllers/interfaces/IStudentCartController";
import { StudentCartController } from "../../controllers/studentControllers/studentCartController";
import { IStudentWishlistController } from "../../controllers/studentControllers/interfaces/IStudentWishlistController";
import { StudentWishlistController } from "../../controllers/studentControllers/studentWishlistController";
import { IStudentCouponController } from "../../controllers/studentControllers/interfaces/IStudentCouponController";
import { StudentCouponController } from "../../controllers/studentControllers/studentCouponController";
import { IStudentCheckoutController } from "../../controllers/studentControllers/interfaces/IStudentCheckoutController";
import { StudentCheckoutController } from "../../controllers/studentControllers/studentCheckoutController";
import { IStudentEnrollmentController } from "../../controllers/studentControllers/interfaces/IStudentEnrollmentController";
import { StudentEnrollmentController } from "../../controllers/studentControllers/studentEnrollmentController";
import { IStudentLmsEnrollmentController } from "../../controllers/studentControllers/interfaces/IStudentLmsEnrollmentController";
import { StudentLmsEnrollmentController } from "../../controllers/studentControllers/studentLmsEnrollmentController";
import { IStudentCourseReviewController } from "../../controllers/studentControllers/interfaces/IStudentCourseReviewController";
import { StudentCourseReviewController } from "../../controllers/studentControllers/studentCourseReviewController";
import { IStudentWalletController } from "../../controllers/studentControllers/interfaces/IStudentWalletController";
import { StudentWalletController } from "../../controllers/studentControllers/studentWalletController";
import { IStudentWalletPaymentController } from "../../controllers/studentControllers/interfaces/IStudentWalletPaymentController"; 
import { StudentWalletPaymentController } from "../../controllers/studentControllers/studentWalletPaymentController";
import { IStudentOrderController } from "../../controllers/studentControllers/interfaces/IStudentOrderController";
import { StudentOrderController } from "../../controllers/studentControllers/studentOrderController";
import { IStudentInstructorListingController } from "../../controllers/studentControllers/interfaces/IStudentInstructorListingController";
import { StudentInstructorListingController } from "../../controllers/studentControllers/studentInstructorListingController";
import { IStudentSlotController } from "../../controllers/studentControllers/interfaces/IStudentSlotController";
import { StudentSlotController } from "../../controllers/studentControllers/studentSlotController";
import { IStudentSlotBookingController } from "../../controllers/studentControllers/interfaces/IStudentSlotBookingController";
import { StudentSlotBookingController } from "../../controllers/studentControllers/studentSlotBookingController";
import { IStudentDashboardController } from "../../controllers/studentControllers/interfaces/IStudentDashboardController";
import { StudentDashboardController } from "../../controllers/studentControllers/studentDashboardController";
import { IStudentLearningPathController } from "../../controllers/studentControllers/interfaces/IStudentsideLMSController";
import { StudentLearningPathController } from "../../controllers/studentControllers/studentsideLMSController";
import { LearningPathRepo } from "../../repositories/learningPathRepo";

const enrollmentRepository : IEnrollmentRepository = new EnrollmentRepository()
const jwtService: IJwtService = new JwtService();
const emailService: IEmail = new SendEmail();
const otpGenerateService: IOtpGenerate = new OtpGenerate();
const otpService: IOtpServices = new RedisOtpService();

const studentRepository: IStudentRepository = new StudentRepository();
const studentService: IStudentService = new StudentServices(studentRepository);
const studentController: IStudentController = new StudentController(
  studentService,
  otpService,
  otpGenerateService,
  jwtService,
  emailService
);

//  Student Profile

const studentProfileRepo: IStudentProfileRepository = new studentProfileRepository();
const studentProfileService: IStudentProfileService = new StudentProfileService(studentProfileRepo);
const studentProfileController: IStudentProfileController = new StudentProfileController(studentProfileService);

// Student Course (LMS Core)
const chapterReadOnlyRepository: IChapterReadOnlyRepository = new ChapterReadOnlyRepository();
const quizReadOnlyRepository: IQuizReadOnlyRepository = new QuizReadOnlyRepository();
const studentCourseOfferRepo: IStudentCourseOfferRepository = new StudentCourseOfferRepository();
const studentModuleRepo: IStudentModuleRepository = new StudentModuleRepository();
const studentCourseRepository: IStudentCourseRepository = new StudentCourseRepository(
  chapterReadOnlyRepository,
  quizReadOnlyRepository,
  studentCourseOfferRepo
);

const studentCourseService: IStudentCourseService = new StudentCourseService(
  studentCourseRepository,
  studentModuleRepo,
  new StudentCourseReviewRepo(),
  enrollmentRepository,
);

const studentCourseController: IStudentCourseController = new StudentCourseController(studentCourseService);

// Category

const categoryReadOnlyRepository: ICategoryReadOnlyRepository = new CategoryReadOnlyRepository();
const categoryReadOnlyService: ICategoryReadOnlyService = new CategoryReadOnlyService(categoryReadOnlyRepository);
const categoryReadOnlyController: ICategoryReadOnlyController = new CategoryReadOnlyController(categoryReadOnlyService);

// Student LMS Dashboard
const studentLmsRepo: IStudentLmsRepo = new StudentLmsRepo(studentCourseOfferRepo);
const studentLmsService: IStudentLmsService = new StudentLmsService(studentLmsRepo);
const studentLmsController: IStudentLmsController = new StudentLmsController(studentLmsService);

// Cart

const studentCartRepository: IStudentCartRepository = new StudentCartRepository();
const studentCartService: IStudentCartService = new StudentCartService(
  studentCartRepository,
  studentCourseRepository,
  studentLmsRepo,
  studentCourseOfferRepo,
  enrollmentRepository
);
const studentCartController: IStudentCartController = new StudentCartController(studentCartService);

// Wishlist
const studentWishlistRepository: IStudentWishlistRepository = new StudentWishlistRepository();
const studentWishlistService: IStudentWishlistService = new StudentWishlistService(
  studentWishlistRepository,
  studentCourseRepository,
  studentLmsRepo,
  studentCourseOfferRepo
);
const studentWishlistController: IStudentWishlistController = new StudentWishlistController(studentWishlistService);

// Coupon
const studentCouponRepo: IStudentCouponRepo = new StudentCouponRepo();
const studentCouponService: IStudentCouponService = new StudentCouponService(studentCouponRepo);
const studentCouponController: IStudentCouponController = new StudentCouponController(studentCouponService);

// Checkout & Payment (Wallet + Order)

const adminUserRepository:IAdminUserRepository = new AdminUserRespository();
const adminInstructorRepository:IAdminInstructorRepository = new AdminInstructorRespository();

const adminRespository : IAdminRepository = new AdminRespository(adminUserRepository, adminInstructorRepository);
const walletRepository : IWalletRepository = new WalletRepository();
const walletService: IWalletService = new WalletService(walletRepository, adminRespository);

const learningPathRepo: ILearningPathRepository = new LearningPathRepo();
const learningPathEnrollmentRepo : ILearningPathEnrollmentRepo = new LearningPathEnrollmentRepo();

const studentCheckoutRepository: IStudentCheckoutRepository = new StudentCheckoutRepository(
  new OrderRepository(),
  enrollmentRepository,
  learningPathEnrollmentRepo,
  new CourseRepository(),
  learningPathRepo,
  studentCourseOfferRepo
);

const studentCheckoutService: IStudentCheckoutService = new StudentCheckoutService(
  studentCheckoutRepository,
  studentCartRepository,
  walletService,
  studentCouponRepo,
  enrollmentRepository
);

const studentCheckoutController: IStudentCheckoutController = new StudentCheckoutController(studentCheckoutService);

//  Enrollment

const instructorRepository : IInstructorRepository = new InstructorRepository();
const orderRepo : IOrderRepository = new OrderRepository();
const courseRepo :ICourseRepository = new CourseRepository();

const studentEnrollmentRepository : IStudentEnrollmentRepository = new StudentEnrollmentRepository(
  studentRepository,
  instructorRepository,
  orderRepo
);

const studentEnrollmentService : IStudentEnrollmentService = new StudentEnrollmentService(studentEnrollmentRepository, courseRepo);

const studentEnrollmentController : IStudentEnrollmentController = new StudentEnrollmentController(studentEnrollmentService);

// LMS Enrollment (Learning Path + Courses)

const studentLmsEnrollmentRepo : IStudentLmsEnrollmentRepo = new StudentLmsEnrollmentRepo(
  learningPathRepo,
  learningPathEnrollmentRepo,
  studentRepository,
  instructorRepository,
  studentEnrollmentRepository,
  orderRepo,
  courseRepo
);

const studentLmsEnrollmentService : IStudentLmsEnrollmentService = new StudentLmsEnrollmentService(
  studentLmsEnrollmentRepo,
  studentEnrollmentRepository,
  orderRepo
);

const studentLmsEnrollmentController : IStudentLmsEnrollmentController = new StudentLmsEnrollmentController(studentLmsEnrollmentService);

// Course Review & Rating

const courseRatingRepo : ICourseRatingRepository = new CourseRatingRepository(new CourseRepository());
const courseRatingService : ICourseRatingService = new CourseRatingService(courseRatingRepo);
const studentCourseReviewRepo : IStudentCourseReviewRepo = new StudentCourseReviewRepo();

const studentCourseReviewService:IStudentCourseReviewService = new StudentCourseReviewService(studentCourseReviewRepo, courseRatingService);
const studentCourseReviewController : IStudentCourseReviewController = new StudentCourseReviewController(studentCourseReviewService);

// Wallet & Wallet Payment

const walletPaymentRepository : IWalletPaymentRepository = new WalletPaymentRepository();
const walletPaymentService : IWalletPaymentService = new WalletPaymentService(walletPaymentRepository, walletService);

const studentWalletController : IStudentWalletController = new StudentWalletController(walletService);
const studentWalletPaymentController : IStudentWalletPaymentController = new StudentWalletPaymentController(walletPaymentService);

// Order History

const studentOrderRepository : IStudentOrderRepository = new StudentOrderRepository();
const studentOrderService : IStudentOrderService = new StudentOrderService(studentOrderRepository, studentCheckoutService);
const studentOrderController : IStudentOrderController = new StudentOrderController(studentOrderService);

// Instructor Listing

const studentInstructorListingRepository : IStudentInstructorListingRepository = new StudentInstructorListingRepository();
const studentInstructorListingService : IStudentInstructorListingService = new StudentInstructorListingService(studentInstructorListingRepository);
const studentInstructorListingController : IStudentInstructorListingController = new StudentInstructorListingController(studentInstructorListingService);

// Slot Viewing & Booking

const studentSlotRepository : IStudentSlotRepository = new StudentSlotRepository();
const studentSlotService : IStudentSlotService = new StudentSlotService(studentSlotRepository);
const studentSlotController : IStudentSlotController = new StudentSlotController(studentSlotService);

const studentSlotBookingRepository : IStudentSlotBookingRepository = new StudentSlotBookingRepository();
const studentSlotBookingService : IStudentSlotBookingService= new StudentSlotBookingService(
  studentSlotBookingRepository,
  studentSlotRepository,
  walletService,
  emailService
);
const studentSlotBookingController : IStudentSlotBookingController = new StudentSlotBookingController(studentSlotBookingService);

// Dashboard

const studentDashboardRepository : IStudentDashboardRepository = new StudentDashboardRepository(
  new EnrollmentRepository(),
  new BookingRepository(),
  new OrderRepository()
);
const studentDashboardService : IStudentDashboardService = new StudentDashboardService(studentDashboardRepository);
const studentDashboardController : IStudentDashboardController = new StudentDashboardController(studentDashboardService);

// Learning Path (Student Side)

const studentLearningPathRepo : IStudentLearningPathRepository = new StudentLearningPathRepository();
const studentLearningPathService : IStudentLearningPathService = new StudentLearningPathService(studentLearningPathRepo);
const studentLearningPathController : IStudentLearningPathController = new StudentLearningPathController(studentLearningPathService);


export {
  studentController,
  studentProfileController,
  studentCourseController,
  categoryReadOnlyController,
  studentLmsController,
  studentCartController,
  studentWishlistController,
  studentCouponController,
  studentCheckoutController,
  studentEnrollmentController,
  studentLmsEnrollmentController,
  studentCourseReviewController,
  studentWalletController,
  studentWalletPaymentController,
  studentOrderController,
  studentInstructorListingController,
  studentSlotController,
  studentSlotBookingController,
  studentDashboardController,
  studentLearningPathController,
};