import { SendEmail } from "../../utils/sendOtpEmail";
import { IEmail } from "../../types/Email";
const emailService: IEmail = new SendEmail();

import { IAdminRepository } from "../../repositories/adminRepository/interface/IAdminRepository";
import { AdminRespository } from "../../repositories/adminRepository/adminRepository";
import { IAdminService } from "../../services/adminServices/interface/IAdminService";
import { AdminService } from "../../services/adminServices/adminService";
import { IAdminController } from "../../controllers/adminControllers/interface/IAdminController";
import { AdminController } from "../../controllers/adminControllers/adminController";

import { IAdminUserRepository } from "../../repositories/adminRepository/interface/IAdminUserRepository";
import { AdminUserRespository } from "../../repositories/adminRepository/adminUserRepository";
import { IAdminInstructorRepository } from "../../repositories/adminRepository/interface/IAdminInstructorRepository";
import { AdminInstructorRespository } from "../../repositories/adminRepository/adminInstructorRepository";

import { IAdminVerificationRepository } from "../../repositories/adminRepository/interface/IAdminVerificationRepository"; 
import { AdminVerificationRepository } from "../../repositories/adminRepository/adminVerificationRepository";
import { IAdminVerificationService } from "../../services/adminServices/interface/IAdminVerificationService";
import { AdminVerificationService } from "../../services/adminServices/adminVerificationService";
import IAdminVerificationController from "../../controllers/adminControllers/interface/IAdminVerificationController";
import { AdminVerificationController } from "../../controllers/adminControllers/adminVerificationController";

import { IAdminCategoryRepository } from "../../repositories/adminRepository/interface/IAdminCategoryRepository";
import { AdminCategoryRepository } from "../../repositories/adminRepository/adminCateogyRepository";
import { IAdminCategoryService } from "../../services/adminServices/interface/IAdminCategoryService";
import { AdminCategoryService } from "../../services/adminServices/adminCategoryService";
import { IAdminCategoryController } from "../../controllers/adminControllers/interface/IAdminCategoryController";
import { AdminCategoryController } from "../../controllers/adminControllers/adminCategoryController";

import { IAdminCourseRepository } from "../../repositories/adminRepository/interface/IAdminCourseRepository";
import { AdminCourseRepository } from "../../repositories/adminRepository/adminCourseRepository";
import { IAdminCourseService } from "../../services/adminServices/interface/IAdminCourseService";
import { AdminCourseService } from "../../services/adminServices/adminCourseService";
import { IAdminCourseController } from "../../controllers/adminControllers/interface/IAdminCourseController";
import { AdminCourseController } from "../../controllers/adminControllers/adminCourseController";

import { IAdminDashboardRepository } from "../../repositories/adminRepository/interface/IAdminDashboardRepository";
import { AdminDashboardRepository } from "../../repositories/adminRepository/adminDashboardRepository";
import { IAdminDashboardService } from "../../services/adminServices/interface/IAdminDashboardService";
import { AdminDashboardService } from "../../services/adminServices/adminDashboardService";
import { IAdminDashboardController } from "../../controllers/adminControllers/interface/IAdminDashboardController";
import { AdminDashboardController } from "../../controllers/adminControllers/adminDashboardController";

import { IAdminMembershipRepository} from "../../repositories/adminRepository/interface/IAdminMembershipRepository";
import { AdminMembershipRepository } from "../../repositories/adminRepository/adminMembershipRepository";
import { IAdminMembershipService } from "../../services/adminServices/interface/IAdminMembershipService";
import { AdminMembershipService } from "../../services/adminServices/adminMembershipService";
import { IAdminMembershipController } from "../../controllers/adminControllers/interface/IAdminMembershipController";
import { AdminMembershipController } from "../../controllers/adminControllers/adminMembershipController";

import { IAdminMembershipOrderRepository } from "../../repositories/adminRepository/interface/IAdminMembershipOrderRepository";
import { AdminMembershipOrderRepository } from "../../repositories/adminRepository/adminMembershipOrderRepository";
import { IAdminMembershipOrderService } from "../../services/adminServices/interface/IAdminMembershipOrderService";
import { AdminMembershipOrderService } from "../../services/adminServices/adminMembershipOrderService";
import { IAdminMembershipOrderController } from "../../controllers/adminControllers/interface/IAdminMembershipOrderController";
import { AdminMembershipOrderController} from "../../controllers/adminControllers/adminMembershipOrderController";

import { IAdminWalletController } from "../../controllers/adminControllers/interface/IAdminWalletController";
import { AdminWalletController } from "../../controllers/adminControllers/adminWalletController";
import { IAdminWalletPaymentController } from "../../controllers/adminControllers/interface/IAdminWalletPaymentController";
import { AdminWalletPaymentController } from "../../controllers/adminControllers/adminWalletPaymentController";

import { IAdminCouponRepo } from "../../repositories/adminRepository/interface/IAdminCouponRepo";
import { AdminCouponRepo } from "../../repositories/adminRepository/adminCouponRepo";
import { IAdminCouponService } from "../../services/adminServices/interface/IAdminCouponService";
import { AdminCouponService } from "../../services/adminServices/adminCouponService";
import { IAdminCouponController } from "../../controllers/adminControllers/interface/IAdminCouponController";
import { AdminCouponController } from "../../controllers/adminControllers/adminCouponController";

import { IAdminCourseOfferRepo } from "../../repositories/adminRepository/interface/IAdminCourseOfferRepo";
import { AdminCourseOfferRepo } from "../../repositories/adminRepository/adminCourseOfferRepo";
import { IAdminCourseOfferService } from "../../services/adminServices/interface/IAdminCourseOfferService";
import { AdminCourseOfferService } from "../../services/adminServices/adminCourseOfferService";
import { IAdminCourseOfferController } from "../../controllers/adminControllers/interface/IAdminCourseOfferController";
import { AdminCourseOfferController } from "../../controllers/adminControllers/adminCourseOfferController";

import { IAdminCourseReviewRepo } from "../../repositories/adminRepository/interface/IAdminCourseReviewRepo";
import { AdminCourseReviewRepo } from "../../repositories/adminRepository/adminCourseReviewRepo";
import { IAdminCourseReviewService } from "../../services/adminServices/interface/IAdminCourseReviewService";
import { AdminCourseReviewService } from "../../services/adminServices/adminCourseReviewService";
import { IAdminCourseReviewController } from "../../controllers/adminControllers/interface/IAdminCourseReviewController";
import { AdminCourseReviewController } from "../../controllers/adminControllers/adminCourseReviewController";

import { IJwtService } from "../../services/interface/IJwtService";
import { JwtService } from "../../services/jwtService";
import { IHashService } from "../../services/interface/IHashService";
import { HashService } from "../../services/hashService";
import { IWalletService } from "../../services/interface/IWalletService";
import { WalletService } from "../../services/walletService";
import { IWalletPaymentService } from "../../services/interface/IWalletPaymentService";
import { WalletPaymentService } from "../../services/walletPaymentService";
import { IWithdrawalRequestService } from "../../services/interface/IWithdrawalRequestService";
import { WithdrawalRequestService } from "../../services/withdrawalRequestService";

import IInstructorRepository from "../../repositories/instructorRepository/interface/IInstructorRepository";
import InstructorRepository  from "../../repositories/instructorRepository/instructorRepository";
import IInstructorService from "../../services/instructorServices/interface/IInstructorService";
import InstructorService from "../../services/instructorServices/instructorService";
import { CourseRepository } from "../../repositories/CourseRepository";
import { OrderRepository } from "../../repositories/OrderRepository";
import { InstructorMembershipOrder } from "../../repositories/InstructorMemberShirpOrderRepository";
import { CourseRatingRepository } from "../../repositories/courseRatingRepository";
import { ModuleDetailRepository } from "../../repositories/ModuleRepository";
import { ChapterDetailRepository } from "../../repositories/ChapterRepository";
import { QuizDetailRepository } from "../../repositories/QuizRepository";
import { WalletRepository } from "../../repositories/WalletRepository";
import { WalletPaymentRepository } from "../../repositories/walletPaymentRepository";
import { WithdrawalRequestRepository } from "../../repositories/withdrawalRequestRepository";
import { AdminWithdrawalController } from "../../controllers/adminControllers/adminWithdrawalController";
import { IAdminWithdrawalController } from "@controllers/adminControllers/interface/IAdminWithdrawalController";

const adminUserRepository: IAdminUserRepository = new AdminUserRespository();
const adminInstructorRepository: IAdminInstructorRepository = new AdminInstructorRespository();
const adminRespository: IAdminRepository = new AdminRespository(
  adminUserRepository,
  adminInstructorRepository
);


const instructorRepo : IInstructorRepository = new InstructorRepository()
const instructorService:IInstructorService =new InstructorService(instructorRepo)

const jwtService: IJwtService = new JwtService();
const hashService: IHashService = new HashService();
const walletRepository = new WalletRepository();
const walletService: IWalletService = new WalletService(walletRepository,adminRespository); 
const walletPaymentService: IWalletPaymentService = new WalletPaymentService(new WalletPaymentRepository(), walletService);
const withdrawalService: IWithdrawalRequestService = new WithdrawalRequestService(
  new WithdrawalRequestRepository(),
  walletService,
  new InstructorRepository()
);


const adminService: IAdminService = new AdminService(adminRespository);
const adminController: IAdminController = new AdminController(adminService, jwtService, hashService);

// Verification
const adminVerificationRepository:IAdminVerificationRepository = new AdminVerificationRepository();
const adminVerificationService:IAdminVerificationService = new AdminVerificationService(adminVerificationRepository,instructorService);
const adminVerificationController:IAdminVerificationController = new AdminVerificationController(adminVerificationService,emailService);

// Category
const adminCategoryRepository : IAdminCategoryRepository = new AdminCategoryRepository();
const adminCategoryServie : IAdminCategoryService= new AdminCategoryService(adminCategoryRepository);
const adminCategoryController : IAdminCategoryController = new AdminCategoryController(adminCategoryServie);

// Course Management
const adminCourseRepository: IAdminCourseRepository = new AdminCourseRepository(new ModuleDetailRepository());
const adminCourseService : IAdminCourseService = new AdminCourseService(
  adminCourseRepository,
  new ChapterDetailRepository(),
  new QuizDetailRepository(),
  adminInstructorRepository,
  adminCategoryRepository
);
const adminCourseController:IAdminCourseController = new AdminCourseController(adminCourseService);

// Dashboard
const adminDashboardRepository:IAdminDashboardRepository = new AdminDashboardRepository(
  new InstructorRepository(),
  new CourseRepository(),
  new OrderRepository(),
  new InstructorMembershipOrder()
);
const adminDashboardService : IAdminDashboardService = new AdminDashboardService(adminDashboardRepository);
const adminDashboardController:IAdminDashboardController = new AdminDashboardController(adminDashboardService);

// Membership
const adminMembershipRepository : IAdminMembershipRepository = new AdminMembershipRepository();
const adminMembershipService : IAdminMembershipService = new AdminMembershipService(adminMembershipRepository);
const adminMembershipController : IAdminMembershipController = new AdminMembershipController(adminMembershipService);

const adminMembershipOrderRepository : IAdminMembershipOrderRepository = new AdminMembershipOrderRepository();
const adminMembershipOrderService : IAdminMembershipOrderService= new AdminMembershipOrderService(adminMembershipOrderRepository);
const adminMembershipOrderController : IAdminMembershipOrderController = new AdminMembershipOrderController(adminMembershipOrderService);

// Wallet
const adminWalletController:IAdminWalletController = new AdminWalletController(walletService);
const adminWalletPaymentController:IAdminWalletPaymentController = new AdminWalletPaymentController(walletPaymentService);

// Coupon & Offer
const adminCouponRepo : IAdminCouponRepo = new AdminCouponRepo();
const adminCouponService : IAdminCouponService = new AdminCouponService(adminCouponRepo);
const adminCouponController : IAdminCouponController = new AdminCouponController(adminCouponService);

const adminCourseOfferRepo : IAdminCourseOfferRepo = new AdminCourseOfferRepo();
const adminCourseOfferService : IAdminCourseOfferService = new AdminCourseOfferService(adminCourseOfferRepo);
const adminCourseOfferController : IAdminCourseOfferController = new AdminCourseOfferController(adminCourseOfferService);

// Review Management
const adminCourseReviewRepo : IAdminCourseReviewRepo= new AdminCourseReviewRepo(adminUserRepository);
const adminCourseReviewService : IAdminCourseReviewService = new AdminCourseReviewService(adminCourseReviewRepo, new CourseRatingRepository(new CourseRepository()));
const adminCourseReviewController : IAdminCourseReviewController = new AdminCourseReviewController(adminCourseReviewService);

// Withdrawal
const adminWithdrawalController : IAdminWithdrawalController = new AdminWithdrawalController(withdrawalService);

export {
  adminController,
  adminVerificationController,
  adminCategoryController,
  adminCourseController,
  adminDashboardController,
  adminMembershipController,
  adminMembershipOrderController,
  adminWalletController,
  adminWalletPaymentController,
  adminCouponController,
  adminCourseOfferController,
  adminCourseReviewController,
  adminWithdrawalController,
};