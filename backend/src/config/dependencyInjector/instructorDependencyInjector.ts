import  IInstructorRepository  from "../../repositories/instructorRepository/interface/IInstructorRepository";
import  InstructorRepository  from "../../repositories/instructorRepository/instructorRepository";
import IInstructorService  from "../../services/instructorServices/interface/IInstructorService";
import  InstructorService  from "../../services/instructorServices/instructorService";
import IInstructorController from "../../controllers/instructorController/interfaces/IInstructorController";
import { InstructorController } from "../../controllers/instructorController/instructorController";

import  IOtpServices  from "../../services/interface/IOtpService";
import { RedisOtpService } from "../../services/otpService";
import { IOtpGenerate } from "../../types/types";
import { OtpGenerate } from "../../utils/otpGenerator";
import { IJwtService } from "../../services/interface/IJwtService";
import { JwtService } from "../../services/jwtService";
import { IEmail } from "../../types/Email";
import { SendEmail } from "../../utils/sendOtpEmail";

import { IInstructorVerificationRepository } from "../../repositories/instructorRepository/interface/IInstructorVerifcationRepository";
import { InstructorVerificationRepository } from "../../repositories/instructorRepository/instructorVerificationRepository";
import { IInstructorVerificationService } from "../../services/instructorServices/interface/IInstructorVerificationService";
import { InstructorVerificationService } from "../../services/instructorServices/instructorVerificationService";
import IInstructorVerificationController from "../../controllers/instructorController/interfaces/IInstructorVerificationController";
import { InstructorVerificationController } from "../../controllers/instructorController/instructorVerificationController";

import { IInstructorProfileRepository } from "../../repositories/instructorRepository/interface/IInstructorProfileRepository";
import { InstructorProfileRepository } from "../../repositories/instructorRepository/instructorProfileRepository";
import { IInstructorProfileService } from "../../services/instructorServices/interface/IInstructorProfileService";
import { InstructorProfileService } from "../../services/instructorServices/instructorProfileService";
import { IInstructorProfileController } from "../../controllers/instructorController/interfaces/IInstructorProfileController";
import { InstructorProfileController } from "../../controllers/instructorController/instructorProfileController";

import { IInstructorCategoryRepository } from "../../repositories/instructorRepository/interface/IInstructorCategoryRepository";
import { InstructorCategoryRepository } from "../../repositories/instructorRepository/instructorCategoryRepository";
import { IInstructorCategoryService } from "../../services/instructorServices/interface/IInstructorCategoryService";
import { InstructorCategoryService } from "../../services/instructorServices/instructorCategoryService";
import { IInstructorCategoryController } from "../../controllers/instructorController/interfaces/IInstructorCategoryController";
import { InstructorCategoryController } from "../../controllers/instructorController/instructorCategoryController";

// Course Management
import { IInstructorChapterRepository } from "../../repositories/instructorRepository/interface/IInstructorChapterRepository";
import { InstructorChapterRepository }from "../../repositories/instructorRepository/instructorChapterRepository";
import { IInstructorModuleRepository } from "../../repositories/instructorRepository/interface/IInstructorModuleRepository";
import { InstructorModuleRepository } from "../../repositories/instructorRepository/instructorModuleRepository";
import { IInstructorCourseRepository } from "../../repositories/instructorRepository/interface/IInstructorCourseRepository";
import { InstructorCourseRepository } from "../../repositories/instructorRepository/instructorCourseRepository";
import { IInstructorQuizRepository } from "../../repositories/instructorRepository/interface/IInstructorQuizRepository";
import { InstructorQuizRepository } from "../../repositories/instructorRepository/instructorQuizRepository";

import { IInstructorChapterService } from "../../services/instructorServices/interface/IInstructorChapterService";
import { InstructorChapterService } from "../../services/instructorServices/instructorChapterService";
import { IInstructorModuleService } from "../../services/instructorServices/interface/IInstructorModuleService";
import { InstructorModuleService } from "../../services/instructorServices/instructorModuleService";
import { IInstructorCourseService } from "../../services/instructorServices/interface/IInstructorCourseService";
import { InstructorCourseService } from "../../services/instructorServices/instructorCourseService";
import { IInstructorQuizService } from "../../services/instructorServices/interface/IInstructorQuizService";
import { InstructorQuizService } from "../../services/instructorServices/instructorQuizService";

import { IInstructorChapterController } from "../../controllers/instructorController/interfaces/IInstructorChapterController";
import { InstructorChapterController } from "../../controllers/instructorController/instructorChapterController";
import { IInstructorModuleController } from "../../controllers/instructorController/interfaces/IInstructorModuleController";
import { InstructorModuleController } from "../../controllers/instructorController/instructorModuleController";
import { IInstructorCourseController } from "../../controllers/instructorController/interfaces/IInstructorCourseController";
import { InstructorCourseController } from "../../controllers/instructorController/instructorCourseController";
import { IInstructorQuizController } from "../../controllers/instructorController/interfaces/IInstructorQuizController";
import { InstructorQuizController } from "../../controllers/instructorController/instructorQuizController";
import { CoursePublishCron } from "../../cron/coursePublishCron";

// Dashboard
import { IInstructorAllCourseDashboardRepository } from "../../repositories/instructorRepository/interface/IInstructorAllCourseDashboardRepository";
import { InstructorAllCourseDashboardRepository } from "../../repositories/instructorRepository/instructorAllCourseDashboardRepository";
import { IInstructorAllCourseDashboardService } from "../../services/instructorServices/interface/IInstructorAllDashboardService";
import { InstructorAllCourseDashboardService } from "../../services/instructorServices/instructorAllDashboardService";
import { IInstructorAllDashboardController } from "../../controllers/instructorController/interfaces/IInstructorAllDashboardController";
import { InstructorAllCourseDashboardController } from "../../controllers/instructorController/instructorAllDashboardController";

import { IInstructorCourseSpecificDashboardRepository } from "../../repositories/instructorRepository/interface/IInstructorSpecificCourseDashboardRepository";
import { InstructorSpecificCourseDashboardRepository } from "../../repositories/instructorRepository/instructorSpecificCourseDashboardRepository";
import { IInstructorSpecificCourseDashboardService } from "../../services/instructorServices/interface/IInstructorSpecificCourseService";
import { InstructorSpecificCourseDashboardService } from "../../services/instructorServices/instructorSpecificCourseService";
import { IInstructorCourseSpecificDashboardController } from "../../controllers/instructorController/interfaces/IInstructorSpecificCourseController";
import { InstructorSpecificCourseDashboardController } from "../../controllers/instructorController/instructorSpecificCourseController";

// Membership & Wallet
import { IInstructorMembershipRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipRepository";
import { InstructorMembershipRepository } from "../../repositories/instructorRepository/instructorMembershipRepository";
import { IInstructorMembershipService } from "../../services/instructorServices/interface/IInstructorMembershipService";
import { InstructorMembershipService } from "../../services/instructorServices/instructorMembershipService";
import { IInstructorMembershipController } from "../../controllers/instructorController/interfaces/IInstructorMembershipController";
import { InstructorMembershipController } from "../../controllers/instructorController/instructorMembershipController";

import { IInstructorMembershipOrderRepository } from "../../repositories/instructorRepository/interface/IInstructorMembershipOrderRepository";
import { InstructorMembershipOrderRepository } from "../../repositories/instructorRepository/instructorMembershipOrderRepository";
import { IInstructorMembershipOrderService } from "../../services/instructorServices/interface/IInstructorMembershipOrderService";
import { InstructorMembershipOrderService } from "../../services/instructorServices/instructorMembershipOrderService";
import { IInstructorMembershipOrderController } from "../../controllers/instructorController/interfaces/IInstructorMembershipOrderController";
import { InstructorMembershipOrderController } from "../../controllers/instructorController/instructorMembershipOrderController";

import { IInstructorWalletController } from "../../controllers/instructorController/interfaces/IInstructorWalletController";
import { InstructorWalletController } from "../../controllers/instructorController/instructorWalletController";
import { IInstructorWalletPaymentController } from "../../controllers/instructorController/interfaces/IInstructorWalletPaymentController";
import { InstructorWalletPaymentController } from "../../controllers/instructorController/instructorWalletPaymentController";

import { IInstructorWithdrawalController } from "../../controllers/instructorController/interfaces/IInstructorWithdrawalController";
import { InstructorWithdrawalController } from "../../controllers/instructorController/instructorWithdrawalController";

// Slot & Review
import { IInstructorSlotRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotRepository";
import { InstructorSlotRepository } from "../../repositories/instructorRepository/instructorSlotRepository";
import { IInstructorSlotService } from "../../services/instructorServices/interface/IInstructorSlotService";
import { InstructorSlotService } from "../../services/instructorServices/instructorSlotService";
import { IInstructorSlotController } from "../../controllers/instructorController/interfaces/IInstructorSlotController";
import { InstructorSlotController } from "../../controllers/instructorController/instructorSlotController";

import { IInstructorSlotBookingRepository } from "../../repositories/instructorRepository/interface/IInstructorSlotBookingRepository";
import { InstructorSlotBookingRepository } from "../../repositories/instructorRepository/instructorSlotBookingRepository";
import { IInstructorSlotBookingService } from "../../services/instructorServices/interface/IInstructorSlotBookingService";
import { InstructorSlotBookingService } from "../../services/instructorServices/instructorSlotBookingService";
import { IInstructorSlotBookingController } from "../../controllers/instructorController/interfaces/IInstructorSlotBookingController";
import { InstructorSlotBookingController } from "../../controllers/instructorController/instructorSlotBookingController";

import { IInstructorCourseOfferRepo } from "../../repositories/instructorRepository/interface/IInstructorCourseofferRepo";
import { InstructorCourseOfferRepo } from "../../repositories/instructorRepository/instructorCourseOfferRepo";
import { IInstructorCourseOfferService } from "../../services/instructorServices/interface/IInstructorCourseOfferService";
import { InstructorCourseOfferService } from "../../services/instructorServices/instructorCourseOfferService";
import { IInstructorCourseOfferController } from "../../controllers/instructorController/interfaces/IInstructorCourseOfferController";
import { InstructorCourseOfferController } from "../../controllers/instructorController/instructorCourseOfferController";

import { IInstructorCourseReviewRepo } from "../../repositories/instructorRepository/interface/IInstructorCourseReviewRepo";
import { InstructorCourseReviewRepo } from "../../repositories/instructorRepository/instructorCourseReviewRepo";
import { IInstructorCourseReviewService } from "../../services/instructorServices/interface/IInstructorCourseReviewService";
import { InstructorCourseReviewService } from "../../services/instructorServices/instructorCourseReviewService";
import { IInstructorCourseReviewController } from "../../controllers/instructorController/interfaces/IInstructorCourseReviewController";
import { InstructorCourseReviewController } from "../../controllers/instructorController/instructorCourseReviewController";
import { OrderRepository } from "../../repositories/OrderRepository";
import { CourseRepository } from "../../repositories/CourseRepository";
import { LearningPathRepo } from "../../repositories/learningPathRepo";
import { EnrollmentRepository } from "../../repositories/EnrollmentRepository";
import { razorpay } from "../../utils/razorpay";
import { IWalletRepository } from "../../repositories/interfaces/IWalletRepository";
import { WalletRepository } from "../../repositories/WalletRepository";
import { IWalletService } from "../../services/interface/IWalletService";
import { WalletService } from "../../services/walletService";

import { IWalletPaymentRepository } from "../../repositories/interfaces/IWalletPaymentRepository";
import { WalletPaymentRepository } from "../../repositories/walletPaymentRepository";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { WalletPaymentService } from "../../services/walletPaymentService";
import { IWithdrawalRequestRepository } from "../../repositories/interfaces/IWithdrawalRequestRepository";
import { WithdrawalRequestRepository } from "../../repositories/withdrawalRequestRepository";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { WithdrawalRequestService } from "../../services/withdrawalRequestService";
import { IAdminUserRepository } from "../../repositories/adminRepository/interface/IAdminUserRepository";
import { AdminUserRespository } from "../../repositories/adminRepository/adminUserRepository";

import { IAdminInstructorRepository } from "../../repositories/adminRepository/interface/IAdminInstructorRepository";
import { AdminInstructorRespository } from "../../repositories/adminRepository/adminInstructorRepository";

import { IAdminRepository } from "../../repositories/adminRepository/interface/IAdminRepository";
import { AdminRespository } from "../../repositories/adminRepository/adminRepository";
import { CourseRatingRepository } from "../../repositories/courseRatingRepository";

const instructorRepo : IInstructorRepository = new InstructorRepository()

const adminUserRepository : IAdminUserRepository = new AdminUserRespository()

const adminInstructorRepository : IAdminInstructorRepository = new AdminInstructorRespository()

const adminRepository : IAdminRepository = new AdminRespository(adminUserRepository,adminInstructorRepository)

const walletRepo : IWalletRepository = new WalletRepository()

const walletService : IWalletService = new WalletService(walletRepo,adminRepository)

const walletPaymentRepository : IWalletPaymentRepository = new WalletPaymentRepository()
const walletPaymentService : IWalletPaymentService = new WalletPaymentService(walletPaymentRepository,walletService)

const withdrawalRequestRepository : IWithdrawalRequestRepository = new WithdrawalRequestRepository()

const withdrawalRequestService : IWithdrawalRequestService = new WithdrawalRequestService(withdrawalRequestRepository,walletService,instructorRepo)

// Shared
const otpService: IOtpServices = new RedisOtpService();
const otpGenerateService: IOtpGenerate = new OtpGenerate();
const jwtService: IJwtService = new JwtService();
const emailService: IEmail = new SendEmail();

const instructorRepository: IInstructorRepository = new InstructorRepository();
const instructorService: IInstructorService = new InstructorService(instructorRepository);
const instructorController: IInstructorController = new InstructorController(
  instructorService,
  otpService,
  otpGenerateService,
  jwtService,
  emailService
);

// Verification
const instructorVerificationRepository : IInstructorVerificationRepository = new InstructorVerificationRepository();
const instructorVerificationService : IInstructorVerificationService = new InstructorVerificationService(instructorVerificationRepository);
const instructorVerificationController : IInstructorVerificationController = new InstructorVerificationController(instructorVerificationService);

// Profile
const instructorProfileRepo : IInstructorProfileRepository = new InstructorProfileRepository();
const instructorProfileService : IInstructorProfileService = new InstructorProfileService(instructorProfileRepo);
const instructorProfileController : IInstructorProfileController = new InstructorProfileController(instructorProfileService);

// Category
const instructorCategoryRepository : IInstructorCategoryRepository = new InstructorCategoryRepository();
const instructorCategoryService : IInstructorCategoryService= new InstructorCategoryService(instructorCategoryRepository);
const instructorCategoryController : IInstructorCategoryController = new InstructorCategoryController(instructorCategoryService);

// Course Dependencies (Order matters!)
const instructorChapterRepository : IInstructorChapterRepository = new InstructorChapterRepository();
const instructorModuleRepo : IInstructorModuleRepository = new InstructorModuleRepository(instructorChapterRepository);
const instructorCourseRepository : IInstructorCourseRepository = new InstructorCourseRepository(instructorModuleRepo);
const instructorQuizRepository : IInstructorQuizRepository = new InstructorQuizRepository();

const instructorModuleService : IInstructorModuleService = new InstructorModuleService(instructorModuleRepo);
const instructorChapterService : IInstructorChapterService = new InstructorChapterService(instructorChapterRepository);
const instructorCourseService : IInstructorCourseService= new InstructorCourseService(
  instructorCourseRepository,
  instructorChapterRepository,
  instructorQuizRepository,
  instructorModuleRepo
);
const instructorQuizService : IInstructorQuizService= new InstructorQuizService(instructorQuizRepository);

const instructorModuleController : IInstructorModuleController = new InstructorModuleController(instructorModuleService, instructorCourseService);
const instructorChapterController : IInstructorChapterController = new InstructorChapterController(
  instructorChapterService,
  instructorModuleService,
  instructorCourseService
);
const instructorCourseController : IInstructorCourseController = new InstructorCourseController(instructorCourseService);
const instructorQuizController : IInstructorQuizController = new InstructorQuizController(instructorQuizService);

// Cron
new CoursePublishCron(instructorCourseRepository).start();

// Dashboard
const instructorDashboardRepo : IInstructorAllCourseDashboardRepository = new InstructorAllCourseDashboardRepository(
  new OrderRepository(),
  new CourseRepository(),
  new LearningPathRepo()
);
const instructorDashboardService : IInstructorAllCourseDashboardService = new InstructorAllCourseDashboardService(instructorDashboardRepo);
const instructorDashboardController : IInstructorAllDashboardController = new InstructorAllCourseDashboardController(instructorDashboardService);

const specificCourseDahboardRepository : IInstructorCourseSpecificDashboardRepository = new InstructorSpecificCourseDashboardRepository(
  new EnrollmentRepository(),
  new CourseRepository(),
  new OrderRepository()
);
const specificCourseDashboardService : IInstructorSpecificCourseDashboardService = new InstructorSpecificCourseDashboardService(specificCourseDahboardRepository);
const specificCourseDashboardController : IInstructorCourseSpecificDashboardController = new InstructorSpecificCourseDashboardController(specificCourseDashboardService);

// Membership & Wallet
const instructorMembershipRepository : IInstructorMembershipRepository = new InstructorMembershipRepository();
const instructorMembershipService : IInstructorMembershipService = new InstructorMembershipService(instructorMembershipRepository, instructorRepository);
const instructorMembershipController : IInstructorMembershipController = new InstructorMembershipController(instructorMembershipService);

const instructorMembershipOrderRepository : IInstructorMembershipOrderRepository = new InstructorMembershipOrderRepository();
const instructorMembershipOrderService : IInstructorMembershipOrderService = new InstructorMembershipOrderService(
  instructorMembershipOrderRepository,
  instructorMembershipRepository,
  instructorRepository,
  razorpay,
  walletService,
  emailService
);
const instructorMembershipOrderController : IInstructorMembershipOrderController = new InstructorMembershipOrderController(
  instructorMembershipOrderService,
  instructorMembershipService
);

const instructorWalletController : IInstructorWalletController = new InstructorWalletController(walletService);
const instructorWalletPaymentController : IInstructorWalletPaymentController = new InstructorWalletPaymentController(walletPaymentService);
const instructorWithdrawalController : IInstructorWithdrawalController = new InstructorWithdrawalController(withdrawalRequestService);

// Slot
const instructorSlotRepository : IInstructorSlotRepository = new InstructorSlotRepository();
const instructorSlotService : IInstructorSlotService = new InstructorSlotService(instructorSlotRepository);
const instructorSlotController : IInstructorSlotController = new InstructorSlotController(instructorSlotService);

const instructorSlotBookingRepository : IInstructorSlotBookingRepository = new InstructorSlotBookingRepository();
const instructorSlotBookingService : IInstructorSlotBookingService = new InstructorSlotBookingService(instructorSlotBookingRepository);
const instructorSlotBookingController : IInstructorSlotBookingController = new InstructorSlotBookingController(instructorSlotBookingService);

// Course Offer & Review
const instructorCourseOfferRepo : IInstructorCourseOfferRepo = new InstructorCourseOfferRepo();
const instructorCourseOfferService : IInstructorCourseOfferService = new InstructorCourseOfferService(new CourseRepository(), instructorCourseOfferRepo);
const instructorCourseOfferController : IInstructorCourseOfferController = new InstructorCourseOfferController(instructorCourseOfferService);

const instructorCourseReviewRepo : IInstructorCourseReviewRepo= new InstructorCourseReviewRepo(new CourseRepository());
const instructorCourseReviewService : IInstructorCourseReviewService = new InstructorCourseReviewService(instructorCourseReviewRepo, new CourseRatingRepository(new CourseRepository()));
const instructorCourseReviewController : IInstructorCourseReviewController = new InstructorCourseReviewController(instructorCourseReviewService);

export {
  instructorController,
  instructorVerificationController,
  instructorProfileController,
  instructorCategoryController,
  instructorCourseController,
  instructorChapterController,
  instructorModuleController,
  instructorQuizController,
  instructorDashboardController,
  specificCourseDashboardController,
  instructorMembershipController,
  instructorMembershipOrderController,
  instructorWalletController,
  instructorWalletPaymentController,
  instructorWithdrawalController,
  instructorSlotController,
  instructorSlotBookingController,
  instructorCourseOfferController,
  instructorCourseReviewController,
};