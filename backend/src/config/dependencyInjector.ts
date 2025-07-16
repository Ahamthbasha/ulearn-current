import { IStudentRepository } from "../repositories/interfaces/IStudentRepository";
import { StudentRepository } from "../repositories/studentRepository/studentRepository";
import IStudentService from "../services/interface/IStudentService";
import { StudentServices } from "../services/studentServices/StudentService";
import IStudentController from "../controllers/studentControllers/interfaces/IStudentController";
import { StudentController } from "../controllers/studentControllers/studentController";

import IOtpRepository from "../repositories/interfaces/IOtpRepository";
import { OtpRepository } from "../repositories/OtpRepository";
import IOtpServices from "../services/interface/IOtpService";
import { OtpService } from "../services/otpService";

import IInstructorController from "../controllers/instructorController/interfaces/IInstructorController";
import { InstructorController } from "../controllers/instructorController/InstructorController";

import IInstructorRepository from "../repositories/interfaces/IInstructorRepository";
import InstructorRepository from "../repositories/instructorRepository/instructorRepository";

import IInstructorService from "../services/interface/IInstructorService";
import InstructorService from "../services/instructorServices/InstructorService";

import { IAdminRepository } from "../repositories/interfaces/IAdminRepository";
import { AdminRespository } from "../repositories/adminRepository/adminRepository";
import { IAdminService } from "../services/interface/IAdminService";
import { AdminService } from "../services/adminServices/AdminService";
import { IAdminController } from "../controllers/adminControllers/interface/IAdminController";
import { AdminController } from "../controllers/adminControllers/adminController";
import { IAdminBaseRepository } from "../repositories/interfaces/IAdminBaseRepository";
import { AdminBaseRespository } from "../repositories/adminRepository/adminBaseRepository";

const otpRepository: IOtpRepository = new OtpRepository();
const otpService: IOtpServices = new OtpService(otpRepository);

const studentRepository: IStudentRepository = new StudentRepository();
const studentService: IStudentService = new StudentServices(studentRepository);
const studentController: IStudentController = new StudentController(
  studentService,
  otpService
);

///////INSTRUCTOR REPOSITORY//////////
const instructorRepository: IInstructorRepository = new InstructorRepository();
const instructorService: IInstructorService = new InstructorService(
  instructorRepository
);
const instructorController: IInstructorController = new InstructorController(
  instructorService,
  otpService
);

///////////////ADMIN REPOSITORY///////////

const adminBaseRepository: IAdminBaseRepository = new AdminBaseRespository();
const adminRespository: IAdminRepository = new AdminRespository(
  adminBaseRepository
);
const adminService: IAdminService = new AdminService(adminRespository);
const adminController: IAdminController = new AdminController(adminService);

//////////////////////admin verification //////////////////////////////////////////
import { IAdminVerificationRepository } from "../repositories/interfaces/IAdminVerificationRepository";
import { AdminVerificationRepository } from "../repositories/adminRepository/adminVerificationRepository";
import { IAdminVerificationService } from "../services/interface/IAdminVerificationService";
import { AdminVerificationService } from "../services/adminServices/AdminVerificationService";
import IAdminVerificationController from "../controllers/adminControllers/interface/IAdminVerificationController";
import { AdminVerificationController } from "../controllers/adminControllers/adminVerificationController";

const adminVerificationRepository: IAdminVerificationRepository =
  new AdminVerificationRepository();
const adminVerificationService: IAdminVerificationService =
  new AdminVerificationService(adminVerificationRepository, instructorService);
const adminVerificationController: IAdminVerificationController =
  new AdminVerificationController(adminVerificationService);

/////////////////////////Instructor verification/////////////////////////////////////

import { IInstructorVerificationRepository } from "../repositories/interfaces/IInstructorVerifcationRepository";
import { InstructorVerificationRepository } from "../repositories/instructorRepository/instructorVerificationRepository";
import { IInstructorVerificationService } from "../services/interface/IInstructorVerificationService";
import { InstructorVerificationService } from "../services/instructorServices/InstructorVerificationService";
import IInstructorVerificationController from "../controllers/instructorController/interfaces/IInstructorVerificationController";
import { InstructorVerificationController } from "../controllers/instructorController/instructorVerificationController";

const instructorVerificationRepository: IInstructorVerificationRepository =
  new InstructorVerificationRepository();
const instructorVerificationService: IInstructorVerificationService =
  new InstructorVerificationService(instructorVerificationRepository);
const instructorVerificationController: IInstructorVerificationController =
  new InstructorVerificationController(instructorVerificationService);

//////////////////////////WEEK 2///////////////////////////////////

///////////////////////student profile controller/////////////////////////////////////////////////

import { studentProfileRepository } from "../repositories/studentRepository/studentProfileRepository";
import { IStudentProfileRepository } from "../repositories/interfaces/IStudentProfileRepository";
import { IStudentProfileService } from "../services/interface/IStudentProfileService";
import { StudentProfileService } from "../services/studentServices/StudentProfileService";
import { IStudentProfileController } from "../controllers/studentControllers/interfaces/IStudentProfileController";
import { StudentProfileController } from "../controllers/studentControllers/studentProfileController";

const studentProfileRepo: IStudentProfileRepository =
  new studentProfileRepository();
const studentProfileService: IStudentProfileService = new StudentProfileService(
  studentProfileRepo
);
const studentProfileController: IStudentProfileController =
  new StudentProfileController(studentProfileService);

////////////////////////INSTRUCTOR PROFILE MANAGEMENT/////////////////////////////////////////////////

import { IInstructorProfileRepository } from "../repositories/interfaces/IInstructorProfileRepository";
import { InstructorProfileRepository } from "../repositories/instructorRepository/instructorProfileRepository";
import { IInstructorProfileService } from "../services/interface/IInstructorProfileService";
import { InstructorProfileService } from "../services/instructorServices/InstructorProfileService";
import { IInstructorProfileController } from "../controllers/instructorController/interfaces/IInstructorProfileController";
import { InstructorProfileController } from "../controllers/instructorController/instructorProfileController";

const instructorProfileRepo: IInstructorProfileRepository =
  new InstructorProfileRepository();
const instructorProfileService: IInstructorProfileService =
  new InstructorProfileService(instructorProfileRepo);
const instructorProfileController: IInstructorProfileController =
  new InstructorProfileController(instructorProfileService);

//////////////////////ADMIN CATEGORY CONTROLLER////////////////////////////////////////

import { IAdminCategoryRepository } from "../repositories/interfaces/IAdminCategoryRepository";
import { AdminCategoryRepository } from "../repositories/adminRepository/adminCateogyRepository";

import { IAdminCategoryService } from "../services/interface/IAdminCategoryService";
import { AdminCategoryService } from "../services/adminServices/AdminCategoryService";

import { IAdminCategoryController } from "../controllers/adminControllers/interface/IAdminCategoryController";
import { AdminCategoryContoller } from "../controllers/adminControllers/adminCategoryController";

const adminCategoryRepository: IAdminCategoryRepository =
  new AdminCategoryRepository();
const adminCategoryServie: IAdminCategoryService = new AdminCategoryService(
  adminCategoryRepository
);
const adminCategoryController: IAdminCategoryController =
  new AdminCategoryContoller(adminCategoryServie);

///////////////////////INSTRUCTROR CATEGORY FETCH/////////////////////////////////////

import { IInstructorCategoryRepository } from "../repositories/interfaces/IInstructorCategoryRepository";
import { InstructorCategoryRepository } from "../repositories/instructorRepository/instructorCategoryRepository";

import { IInstructorCategoryService } from "../services/interface/IInstructorCategoryService";
import { InstructorCategoryService } from "../services/instructorServices/InstructorCategoryService";

import { IInstructorCategoryController } from "../controllers/instructorController/interfaces/IInstructorCategoryController";

import { InstructorCategoryController } from "../controllers/instructorController/instructorCategoryController";

const instructorCategoryRepository: IInstructorCategoryRepository =
  new InstructorCategoryRepository();

const instructorCategoryService: IInstructorCategoryService =
  new InstructorCategoryService(instructorCategoryRepository);

const instructorCategoryController: IInstructorCategoryController =
  new InstructorCategoryController(instructorCategoryService);

///////////////////////INSTRUCTOR CHAPTER CONTROLLER/////////////////////////////////////

import { IInstructorChapterRepository } from "../repositories/interfaces/IInstructorChapterRepository";
import { InstructorChapterRepository } from "../repositories/instructorRepository/instructorChapterRepository";

import { IInstructorChapterService } from "../services/interface/IInstructorChapterService";
import { InstructorChapterService } from "../services/instructorServices/InstructorChapterService";

import { IInstructorChapterController } from "../controllers/instructorController/interfaces/IInstructorChapterController";
import { InstructorChapterController } from "../controllers/instructorController/instructorChapterController";

const instructorChapterRepository: IInstructorChapterRepository =
  new InstructorChapterRepository();

const instructorChapterService: IInstructorChapterService =
  new InstructorChapterService(instructorChapterRepository);

const instructorChapterController: IInstructorChapterController =
  new InstructorChapterController(instructorChapterService);

/////////////////////////INSTRUCTOR QUIZ CONTROLLER////////////////////////////////////////////////////////////////////////////////////////////

import { IInstructorQuizRepository } from "../repositories/interfaces/IInstructorQuizRepository";
import { InstructorQuizRepository } from "../repositories/instructorRepository/instructorQuizRepository";

import { IInstructorQuizService } from "../services/interface/IInstructorQuizService";
import { InstructorQuizService } from "../services/instructorServices/InstructorQuizService";

import { IInstructorQuizController } from "../controllers/instructorController/interfaces/IInstructorQuizController";
import { InstructorQuizController } from "../controllers/instructorController/instructorQuizController";

const instructorQuizRepository: IInstructorQuizRepository =
  new InstructorQuizRepository();

const instructorQuizService: IInstructorQuizService = new InstructorQuizService(
  instructorQuizRepository
);

const instructorQuizController: IInstructorQuizController =
  new InstructorQuizController(instructorQuizService);

//////////////////////INSTRUCTOR COURSE MANAGEMENT///////////////////////////////////////

import { IInstructorCourseRepository } from "../repositories/interfaces/IInstructorCourseRepository";
import { InstructorCourseRepository } from "../repositories/instructorRepository/instructorCourseRepository";

import { IInstructorCourseService } from "../services/interface/IInstructorCourseService";
import { InstructorCourseService } from "../services/instructorServices/InstructorCourseService";

import { IInstructorCourseController } from "../controllers/instructorController/interfaces/IInstructorCourseController";
import { InstructorCourseController } from "../controllers/instructorController/InstructorCourseController";

const instructorCourseRepository: IInstructorCourseRepository =
  new InstructorCourseRepository();

const instructorCourseService: IInstructorCourseService =
  new InstructorCourseService(
    instructorCourseRepository,
    instructorChapterRepository,
    instructorQuizRepository
  );

const instructorCourseController: IInstructorCourseController =
  new InstructorCourseController(instructorCourseService);

////////////////////////ADMIN COURSE CONTROLLER/////////////////////////////////////////////////////////////////////////////////////////////

import { IAdminCourseRepository } from "../repositories/interfaces/IAdminCourseRepository";
import { AdminCourseRepository } from "../repositories/adminRepository/adminCourseRepository";

import { IAdminCourseService } from "../services/interface/IAdminCourseService";
import { AdminCourseService } from "../services/adminServices/AdminCourseService";

import { IAdminCourseController } from "../controllers/adminControllers/interface/IAdminCourseController";
import { AdminCourseController } from "../controllers/adminControllers/adminCourseController";

const adminCourseRepository: IAdminCourseRepository =
  new AdminCourseRepository();

const adminCourseService: IAdminCourseService = new AdminCourseService(
  adminCourseRepository
);

const adminCourseController: IAdminCourseController = new AdminCourseController(
  adminCourseService
);

///////////////////////////STUDENT COURSE CONTROLLER//////////////////////////////////////////////////////////////////////////////////////////

import { IChapterReadOnlyRepository } from "../repositories/interfaces/IChapterReadOnlyRepository";
import { ChapterReadOnlyRepository } from "../repositories/studentRepository/chapterReadOnlyRepository";

import { IQuizReadOnlyRepository } from "../repositories/interfaces/IQuizReadOnlyRepository";
import { QuizReadOnlyRepository } from "../repositories/studentRepository/quizReadOnlyRepository";

import { IStudentCourseRepository } from "../repositories/interfaces/IStudentCourseRepository";
import { StudentCourseRepository } from "../repositories/studentRepository/studentCourseRepository";

import { IStudentCourseService } from "../services/interface/IStudentCourseService";
import { StudentCourseService } from "../services/studentServices/StudentCourseService";

import { IStudentCourseController } from "../controllers/studentControllers/interfaces/IStudentCourseController";
import { StudentCourseController } from "../controllers/studentControllers/studentCourseController";

const chapterReadOnlyRepository: IChapterReadOnlyRepository =
  new ChapterReadOnlyRepository();
const quizReadOnlyRepository: IQuizReadOnlyRepository =
  new QuizReadOnlyRepository();

const studentCourseRepository: IStudentCourseRepository =
  new StudentCourseRepository(
    chapterReadOnlyRepository,
    quizReadOnlyRepository
  );

const studentCourseService: IStudentCourseService = new StudentCourseService(
  studentCourseRepository
);

const studentCourseController: IStudentCourseController =
  new StudentCourseController(studentCourseService);

///////////////////////CATEGORY READ ONLY CONTROLLER FOR STUDENT/////////////////////////////////////

import { ICategoryReadOnlyRepository } from "../repositories/interfaces/ICategoryReadOnlyRepository";
import { CategoryReadOnlyRepository } from "../repositories/studentRepository/CategoryReadOnlyRepository";
import { ICategoryReadOnlyService } from "../services/interface/ICategoryReadOnlyService";
import { CategoryReadOnlyService } from "../services/studentServices/CategoryReadOnlyService";
import { ICategoryReadOnlyController } from "../controllers/studentControllers/interfaces/ICategoryReadOnlyController";
import { CategoryReadOnlyController } from "../controllers/studentControllers/CategoryReadOnlyController";

const categoryReadOnlyRepository: ICategoryReadOnlyRepository =
  new CategoryReadOnlyRepository();

const categoryReadOnlyService: ICategoryReadOnlyService =
  new CategoryReadOnlyService(categoryReadOnlyRepository);

const categoryReadOnlyController: ICategoryReadOnlyController =
  new CategoryReadOnlyController(categoryReadOnlyService);

////////////////////////////CART MANAGEMENT////////////////

import { IStudentCartRepository } from "../repositories/interfaces/IStudentCartRepository";
import { StudentCartRepository } from "../repositories/studentRepository/studentCartRepository";

import { IStudentCartService } from "../services/interface/IStudentCartService";
import { StudentCartService } from "../services/studentServices/StudentCartService";

import { IStudentCartController } from "../controllers/studentControllers/interfaces/IStudentCartController";
import { StudentCartController } from "../controllers/studentControllers/studentCartController";

const studentCartRepository: IStudentCartRepository =
  new StudentCartRepository();

const studentCartService: IStudentCartService = new StudentCartService(
  studentCartRepository
);

const studentCartController: IStudentCartController = new StudentCartController(
  studentCartService
);

///////////////////////STUDENT WISHLIST MANAGEMENT//////////////////////////////////////////////////////////////////////////////////////////////

import { IStudentWishlistRepository } from "../repositories/interfaces/IStudentWishlistRepository";
import { StudentWishlistRepository } from "../repositories/studentRepository/studentWishlistRepository";

import { IStudentWishlistService } from "../services/interface/IStudentWishlistService";
import { StudentWishlistService } from "../services/studentServices/StudentWishlistService";

import { IStudentWishlistController } from "../controllers/studentControllers/interfaces/IStudentWishlistController";
import { StudentWishlistController } from "../controllers/studentControllers/studentWishlistController";

const studentWishlistRepository: IStudentWishlistRepository =
  new StudentWishlistRepository();
const studentWishlistService: IStudentWishlistService =
  new StudentWishlistService(studentWishlistRepository);
const studentWishlistController: IStudentWishlistController =
  new StudentWishlistController(studentWishlistService);

/////////STUDENT CHECKOUT MANAGEMENT///////////////////

import { IStudentCheckoutRepository } from "../repositories/interfaces/IStudentCheckoutRepository";
import { StudentCheckoutRepository } from "../repositories/studentRepository/studentCheckoutRepository";

import { IStudentCheckoutService } from "../services/interface/IStudentCheckoutService";
import { StudentCheckoutService } from "../services/studentServices/StudentCheckoutService";

import { IStudentCheckoutController } from "../controllers/studentControllers/interfaces/IStudentCheckoutController";
import { StudentCheckoutController } from "../controllers/studentControllers/studentCheckoutController";
import { OrderRepository } from "../repositories/OrderRepository";
import { PaymentRepository } from "../repositories/PaymentRepository";
import { EnrollmentRepository } from "../repositories/EnrollmentRepository";
import { CourseRepository } from "../repositories/CourseRepository";

import { IWalletRepository } from "../repositories/interfaces/IWalletRepository";
import { WalletRepository } from "../repositories/WalletRepository";

import { IWalletService } from "../services/interface/IWalletService";
import { WalletService } from "../services/walletService";

const walletRepository: IWalletRepository = new WalletRepository();

const walletService: IWalletService = new WalletService(
  walletRepository,
  adminRespository
);

const studentCheckoutRepository: IStudentCheckoutRepository =
  new StudentCheckoutRepository(
    new OrderRepository(),
    new PaymentRepository(),
    new EnrollmentRepository(),
    new CourseRepository()
  );

const studentCheckoutService: IStudentCheckoutService =
  new StudentCheckoutService(
    studentCheckoutRepository,
    studentCartRepository,
    walletService
  );

const studentCheckoutController: IStudentCheckoutController =
  new StudentCheckoutController(studentCheckoutService);

////////////////////////DASHBOARD MANAGEMENT///////////////////////////////////

import { IInstructorAllCourseDashboardRepository } from "../repositories/interfaces/IInstructorAllCourseDashboardRepository";
import { InstructorAllCourseDashboardRepository } from "../repositories/instructorRepository/instructorAllCourseDashboardRepository";

import { IInstructorAllCourseDashboardService } from "../services/interface/IInstructorAllDashboardService";
import { InstructorAllCourseDashboardService } from "../services/instructorServices/InstructorAllDashboardService";

import { IInstructorAllDashboardController } from "../controllers/instructorController/interfaces/IInstructorAllDashboardController";
import { InstructorAllCourseDashboardController } from "../controllers/instructorController/instructorAllDashboardController";

import {
  GenericRepository,
  IGenericRepository,
} from "../repositories/genericRepository";
import { OrderModel, IOrder } from "../models/orderModel";

const orderRepo: IGenericRepository<IOrder> = new GenericRepository<IOrder>(
  OrderModel
);

const instructorDashboardRepo: IInstructorAllCourseDashboardRepository =
  new InstructorAllCourseDashboardRepository(orderRepo);

const instructorDashboardService: IInstructorAllCourseDashboardService =
  new InstructorAllCourseDashboardService(instructorDashboardRepo);

const instructorDashboardController: IInstructorAllDashboardController =
  new InstructorAllCourseDashboardController(instructorDashboardService);

/////////////////////////INSTRUCTOR SPECIFIC COURSE DASHBOARD/////////////////////////////////////////////////////////////////////////////////////////////

import { IInstructorCourseSpecificDashboardRepository } from "../repositories/interfaces/IInstructorSpecificCourseDashboardRepository";
import { InstructorSpecificCourseDashboardRepository } from "../repositories/instructorRepository/instructorSpecificCourseDashboardRepository";

import { IInstructorSpecificCourseDashboardService } from "../services/interface/IInstructorSpecificCourseService";
import { InstructorSpecificCourseDashboardService } from "../services/instructorServices/InstructorSpecificCourseService";

import { IInstructorCourseSpecificDashboardController } from "../controllers/instructorController/interfaces/IInstructorSpecificCourseController";
import { InstructorSpecificCourseDashboardController } from "../controllers/instructorController/instructorSpecificCourseController";

const specificCourseDahboardRepository: IInstructorCourseSpecificDashboardRepository =
  new InstructorSpecificCourseDashboardRepository(
    new PaymentRepository(),
    new EnrollmentRepository(),
    new CourseRepository(),
    new OrderRepository()
  );

const specificCourseDashboardService: IInstructorSpecificCourseDashboardService =
  new InstructorSpecificCourseDashboardService(
    specificCourseDahboardRepository
  );

const specificCourseDashboardController: IInstructorCourseSpecificDashboardController =
  new InstructorSpecificCourseDashboardController(
    specificCourseDashboardService
  );

///////////////////////////////////////////////////////////

import { IStudentEnrollmentRepository } from "../repositories/interfaces/IStudentEnrollmentRepository";
import { StudentEnrollmentRepository } from "../repositories/studentRepository/studentEnrollementRepository";

import { IStudentEnrollmentService } from "../services/interface/IStudentEnrollmentService";
import { StudentEnrollmentService } from "../services/studentServices/StudentEnrollmentService";

import { IStudentEnrollmentController } from "../controllers/studentControllers/interfaces/IStudentEnrollmentController";
import { StudentEnrollmentController } from "../controllers/studentControllers/studentEnrollmentController";

const studentEnrollmentRepository: IStudentEnrollmentRepository =
  new StudentEnrollmentRepository(studentRepository, instructorRepository);

const studentEnrollmentService: IStudentEnrollmentService =
  new StudentEnrollmentService(studentEnrollmentRepository);

const studentEnrollmentController: IStudentEnrollmentController =
  new StudentEnrollmentController(studentEnrollmentService);

////////////////wallet repository////////////////////

import { IStudentWalletController } from "../controllers/studentControllers/interfaces/IStudentWalletController";
import { StudentWalletController } from "../controllers/studentControllers/studentWalletController";

const studentWalletController: IStudentWalletController =
  new StudentWalletController(walletService);

///////////////////////////////student wallet payment///////////////////////////////////////////////////////////

import { IWalletPaymentRepository } from "../repositories/interfaces/IWalletPaymentRepository";
import { WalletPaymentRepository } from "../repositories/walletPaymentRepository";
import { IWalletPaymentService } from "../services/interface/IWalletPaymentService";
import { WalletPaymentService } from "../services/walletPaymentService";
import { IWalletPaymentController } from "../controllers/studentControllers/interfaces/IStudentWalletPaymentController";
import { StudentWalletPaymentController } from "../controllers/studentControllers/studentWalletPaymentController";

const walletPaymentRepository: IWalletPaymentRepository =
  new WalletPaymentRepository();
const walletPaymentService: IWalletPaymentService = new WalletPaymentService(
  walletPaymentRepository,
  walletService
);
const studentWalletPaymentController: IWalletPaymentController =
  new StudentWalletPaymentController(walletPaymentService);

////////////////INSTRUCTOR Wallet Controller///////////////////////////////

import { IInstructorWalletController } from "../controllers/instructorController/interfaces/IInstructorWalletController";
import { InstructorWalletController } from "../controllers/instructorController/instructorWalletController";

const instructorWalletController: IInstructorWalletController =
  new InstructorWalletController(walletService);

////////Instructor Wallet Payment Controller////////

import { IInstructorWalletPaymentController } from "../controllers/instructorController/interfaces/IInstructorWalletPaymentController";
import { InstructorWalletPaymentController } from "../controllers/instructorController/instructorWalletPaymentController";

const instructorWalletPaymentController: IInstructorWalletPaymentController =
  new InstructorWalletPaymentController(walletPaymentService);

//Admin Wallet//

import { IAdminWalletController } from "../controllers/adminControllers/interface/IAdminWalletController";
import { AdminWalletController } from "../controllers/adminControllers/adminWalletController";

const adminWalletController: IAdminWalletController = new AdminWalletController(
  walletService
);

//Admin Wallet Payment//

import { IAdminWalletPaymentController } from "../controllers/adminControllers/interface/IAdminWalletPaymentController";
import { AdminWalletPaymentController } from "../controllers/adminControllers/adminWalletPaymentController";

const adminWalletPaymentController: IAdminWalletPaymentController =
  new AdminWalletPaymentController(walletPaymentService);

////student order history management/////////////

import { IStudentOrderRepository } from "../repositories/interfaces/IStudentOrderRepository";
import { StudentOrderRepository } from "../repositories/studentRepository/studentOrderRepository";

import { IStudentOrderService } from "../services/interface/IStudentOrderService";
import { StudentOrderService } from "../services/studentServices/StudentOrderService";

import { IStudentOrderController } from "../controllers/studentControllers/interfaces/IStudentOrderController";
import { StudentOrderController } from "../controllers/studentControllers/studentOrderController";

const studentOrderRepository: IStudentOrderRepository =
  new StudentOrderRepository();

const studentOrderService: IStudentOrderService = new StudentOrderService(
  studentOrderRepository
);

const studentOrderController: IStudentOrderController =
  new StudentOrderController(studentOrderService);

/////////ADMIN MEMEBERSHIP MANAGEMENT///////////////////////////////////////////

import { IAdminMembershipRepository } from "../repositories/interfaces/IAdminMembershipRepository";
import { AdminMembershipRepository } from "../repositories/adminRepository/adminMembershipRepository";
import { IAdminMembershipService } from "../services/interface/IAdminMembershipService";
import { AdminMembershipService } from "../services/adminServices/AdminMembershipService";
import { IAdminMembershipController } from "../controllers/adminControllers/interface/IAdminMembershipController";
import { AdminMembershipController } from "../controllers/adminControllers/adminMembershipController";

const adminMembershipRepository: IAdminMembershipRepository =
  new AdminMembershipRepository();

const adminMembershipService: IAdminMembershipService =
  new AdminMembershipService(adminMembershipRepository);

const adminMembershipController: IAdminMembershipController =
  new AdminMembershipController(adminMembershipService);

////////////instructor membership page/////////////////////////////////////////////

import { IInstructorMembershipRepository } from "../repositories/interfaces/IInstructorMembershipRepository";
import { InstructorMembershipRepository } from "../repositories/instructorRepository/instructorMembershipRepository";

import { IInstructorMembershipService } from "../services/interface/IInstructorMembershipService";
import { InstructorMembershipService } from "../services/instructorServices/InstructorMembershipService";

import { IInstructorMembershipController } from "../controllers/instructorController/interfaces/IInstructorMembershipController";
import { InstructorMembershipController } from "../controllers/instructorController/instructorMembershipController";

const instructorMembershipRepository: IInstructorMembershipRepository =
  new InstructorMembershipRepository();

const instructorMembershipService: IInstructorMembershipService =
  new InstructorMembershipService(
    instructorMembershipRepository,
    instructorRepository
  );

const instructorMembershipController: IInstructorMembershipController =
  new InstructorMembershipController(instructorMembershipService);

//buying membership or instructor checkout

import { IInstructorMembershipOrderRepository } from "../repositories/interfaces/IInstructorMembershipOrderRepository";
import { InstructorMembershipOrderRepository } from "../repositories/instructorRepository/instructorMembershipOrderRepository";

import { IInstructorMembershipOrderService } from "../services/interface/IInstructorMembershipOrderService";
import { InstructorMembershipOrderService } from "../services/instructorServices/InstructorMembershipOrderService";

import { IInstructorMembershipOrderController } from "../controllers/instructorController/interfaces/IInstructorMembershipOrderController";
import { InstructorMembershipOrderController } from "../controllers/instructorController/instructorMembershipOrderController";
import { razorpay } from "../utils/razorpay";
import { SendEmail } from "../utils/sendOtpEmail";
import { IEmail } from "../types/Email";

const emailService: IEmail = new SendEmail();
const instructorMembershipOrderRepository: IInstructorMembershipOrderRepository =
  new InstructorMembershipOrderRepository();

const instructorMembershipOrderService: IInstructorMembershipOrderService =
  new InstructorMembershipOrderService(
    instructorMembershipOrderRepository,
    instructorMembershipRepository,
    instructorRepository,
    razorpay,
    walletService,
    emailService
  );

const instructorMembershipOrderController: IInstructorMembershipOrderController =
  new InstructorMembershipOrderController(
    instructorMembershipOrderService,
    instructorMembershipService
  );

/////////////////////ADMIN MEMBERSHIP ORDER MANAGEMENT/////////////////////////////////////

import { IAdminMembershipOrderRepository } from "../repositories/interfaces/IAdminMembershipOrderRepository";
import { AdminMembershipOrderRepository } from "../repositories/adminRepository/adminMembershipOrderRepository";

import { IAdminMembershipOrderService } from "../services/interface/IAdminMembershipOrderService";
import { AdminMembershipOrderService } from "../services/adminServices/AdminMembershipOrderService";

import { IAdminMembershipOrderController } from "../controllers/adminControllers/interface/IAdminMembershipOrderController";
import { AdminMembershipOrderController } from "../controllers/adminControllers/adminMembershipOrderController";

const adminMembershipOrderRepository: IAdminMembershipOrderRepository =
  new AdminMembershipOrderRepository();

const adminMembershipOrderService: IAdminMembershipOrderService =
  new AdminMembershipOrderService(adminMembershipOrderRepository);

const adminMembershipOrderController: IAdminMembershipOrderController =
  new AdminMembershipOrderController(adminMembershipOrderService);

///////////////SLOT MANAGEMENT////////////////////////////

import { IInstructorSlotRepository } from "../repositories/interfaces/IInstructorSlotRepository";
import { InstructorSlotRepository } from "../repositories/instructorRepository/instructorSlotRepository";

import { IInstructorSlotService } from "../services/interface/IInstructorSlotService";
import { InstructorSlotService } from "../services/instructorServices/InstructorSlotService";

import { IInstructorSlotController } from "../controllers/instructorController/interfaces/IInstructorSlotController";
import { InstructorSlotController } from "../controllers/instructorController/instructorSlotController";

const instructorSlotRepository: IInstructorSlotRepository =
  new InstructorSlotRepository();

const instructorSlotService: IInstructorSlotService = new InstructorSlotService(
  instructorSlotRepository
);

const instructorSlotController: IInstructorSlotController =
  new InstructorSlotController(instructorSlotService);

////////////INSTRUCTOR LISTING ON STUDENT SIDE///////////

import { IStudentInstructorListingRepository } from "../repositories/interfaces/IStudentInstructorListingRepository";
import { StudentInstructorListingRepository } from "../repositories/studentRepository/studentInstructorListingRepository";

import { IStudentInstructorListingService } from "../services/interface/IStudentInstructorListingService";
import { StudentInstructorListingService } from "../services/studentServices/StudentInstructorListingService";


import { IStudentInstructorListingController } from "../controllers/studentControllers/interfaces/IStudentInstructorListingController";
import { StudentInstructorListingController } from "../controllers/studentControllers/studentInstructorListingController";


const studentInstructorListingRepository : IStudentInstructorListingRepository = new StudentInstructorListingRepository()

const studentInstructorListingService : IStudentInstructorListingService = new StudentInstructorListingService(studentInstructorListingRepository)

const studentInstructorListingController : IStudentInstructorListingController = new StudentInstructorListingController(studentInstructorListingService)

////student slot viewing////

import { IStudentSlotRepository } from "../repositories/interfaces/IStudentSlotRepository";
import { StudentSlotRepository } from "../repositories/studentRepository/StudentSlotRepository";

import { IStudentSlotService } from "../services/interface/IStudentSlotService";
import { StudentSlotService } from "../services/studentServices/StudentSlotService";


import { IStudentSlotController } from "../controllers/studentControllers/interfaces/IStudentSlotController";
import { StudentSlotController } from "../controllers/studentControllers/studentSlotController";

const studentSlotRepository : IStudentSlotRepository = new StudentSlotRepository()

const studentSlotService : IStudentSlotService = new StudentSlotService(studentSlotRepository)

const studentSlotController : IStudentSlotController = new StudentSlotController(studentSlotService)

///////////////////student slot booking managment//////////

import { IStudentSlotBookingRepository } from "../repositories/interfaces/IStudentSlotBookingRepository";
import { StudentSlotBookingRepository } from "../repositories/studentRepository/studentSlotBookingRepository";

import { IStudentSlotBookingService } from "../services/interface/IStudentSlotBookingService";
import { StudentSlotBookingService } from "../services/studentServices/StudentSlotBookingService";

import { IStudentSlotBookingController } from "../controllers/studentControllers/interfaces/IStudentSlotBookingController";
import { StudentSlotBookingController } from "../controllers/studentControllers/studentSlotBookingController";


const studentSlotBookingRepository : IStudentSlotBookingRepository = new StudentSlotBookingRepository()

const studentSlotBookingService : IStudentSlotBookingService = new StudentSlotBookingService(studentSlotBookingRepository,studentSlotRepository,walletService)

const studentSlotBookingController : IStudentSlotBookingController = new StudentSlotBookingController(studentSlotBookingService)




export {
  studentController,
  instructorController,
  adminController,
  //verification
  adminVerificationController,
  instructorVerificationController,
  //profile management
  studentProfileController,
  instructorProfileController,
  //adminCategoryController
  adminCategoryController,
  //instructorCategoryController
  instructorCategoryController,
  //instructorCourse,chapterController
  instructorCourseController,
  instructorChapterController,
  instructorQuizController,
  //adminCourse controller,
  adminCourseController,
  //studentCourse controller
  studentCourseController,
  //studentCategory controller
  categoryReadOnlyController,
  //student cart controller
  studentCartController,
  //student wishlist controller
  studentWishlistController,
  //student checkout controller
  studentCheckoutController,
  instructorDashboardController,
  specificCourseDashboardController,
  //student enrolled controller
  studentEnrollmentController,
  //student wallet controller
  studentWalletController,
  //student wallet payment service
  studentWalletPaymentController,
  //instructor wallet controller
  instructorWalletController,
  //instructor wallet payment controller
  instructorWalletPaymentController,
  //admin wallet controller
  adminWalletController,
  //admin wallet payment controller
  adminWalletPaymentController,
  //student order controller
  studentOrderController,
  //adminMembership controller,
  adminMembershipController,
  //instructorMembership controller,
  instructorMembershipController,
  //instructorMembership order controller
  instructorMembershipOrderController,
  //admin membership order controller
  adminMembershipOrderController,
  //instructor slot management
  instructorSlotController,
  //student side instructor listing
  studentInstructorListingController,
  //slot viewing
  studentSlotController,
  //slot booking
  studentSlotBookingController,
};
