import { IJwtService } from "../services/interface/IJwtService";
import { JwtService } from "../services/jwtService";
const jwtService: IJwtService = new JwtService();

import { SendEmail } from "../utils/sendOtpEmail";
import { IEmail } from "../types/Email";
const emailService: IEmail = new SendEmail();

import { IOtpGenerate } from "../types/types";
import { OtpGenerate } from "../utils/otpGenerator";

const otpGenerateService: IOtpGenerate = new OtpGenerate();

import { IStudentRepository } from "../repositories/studentRepository/interface/IStudentRepository";
import { StudentRepository } from "../repositories/studentRepository/studentRepository";
import IStudentService from "../services/studentServices/interface/IStudentService";
import { StudentServices } from "../services/studentServices/studentService";
import IStudentController from "../controllers/studentControllers/interfaces/IStudentController";
import { StudentController } from "../controllers/studentControllers/studentController";

import IOtpServices from "../services/interface/IOtpService";
import { RedisOtpService } from "../services/otpService";

import IInstructorController from "../controllers/instructorController/interfaces/IInstructorController";
import { InstructorController } from "../controllers/instructorController/instructorController";

import IInstructorRepository from "../repositories/instructorRepository/interface/IInstructorRepository";
import InstructorRepository from "../repositories/instructorRepository/instructorRepository";

import IInstructorService from "../services/instructorServices/interface/IInstructorService";
import InstructorService from "../services/instructorServices/instructorService";

import { IAdminRepository } from "../repositories/adminRepository/interface/IAdminRepository";
import { AdminRespository } from "../repositories/adminRepository/adminRepository";
import { IAdminService } from "../services/adminServices/interface/IAdminService";
import { AdminService } from "../services/adminServices/adminService";
import { IAdminController } from "../controllers/adminControllers/interface/IAdminController";
import { AdminController } from "../controllers/adminControllers/adminController";

const otpService: IOtpServices = new RedisOtpService();

const studentRepository: IStudentRepository = new StudentRepository();
const studentService: IStudentService = new StudentServices(studentRepository);
const studentController: IStudentController = new StudentController(
  studentService,
  otpService,
  otpGenerateService,
  jwtService,
  emailService,
);

///////INSTRUCTOR REPOSITORY//////////
const instructorRepository: IInstructorRepository = new InstructorRepository();
const instructorService: IInstructorService = new InstructorService(
  instructorRepository,
);
const instructorController: IInstructorController = new InstructorController(
  instructorService,
  otpService,
  otpGenerateService,
  jwtService,
  emailService,
);

///////////////ADMIN REPOSITORY///////////

import { IAdminUserRepository } from "../repositories/adminRepository/interface/IAdminUserRepository";
import { AdmiUserRespository } from "../repositories/adminRepository/adminUserRepository";

import { IAdminInstructorRepository } from "../repositories/adminRepository/interface/IAdminInstructorRepository";
import { AdminInstructorRespository } from "../repositories/adminRepository/adminInstructorRepository";

const adminUserRepository: IAdminUserRepository = new AdmiUserRespository();

const adminInstructorRepository: IAdminInstructorRepository =
  new AdminInstructorRespository();

const adminRespository: IAdminRepository = new AdminRespository(
  adminUserRepository,
  adminInstructorRepository,
);
const adminService: IAdminService = new AdminService(adminRespository);
const adminController: IAdminController = new AdminController(
  adminService,
  jwtService,
);

//////////////////////admin verification //////////////////////////////////////////
import { IAdminVerificationRepository } from "../repositories/adminRepository/interface/IAdminVerificationRepository";
import { AdminVerificationRepository } from "../repositories/adminRepository/adminVerificationRepository";
import { IAdminVerificationService } from "../services/adminServices/interface/IAdminVerificationService";
import { AdminVerificationService } from "../services/adminServices/adminVerificationService";
import IAdminVerificationController from "../controllers/adminControllers/interface/IAdminVerificationController";
import { AdminVerificationController } from "../controllers/adminControllers/adminVerificationController";

const adminVerificationRepository: IAdminVerificationRepository =
  new AdminVerificationRepository();
const adminVerificationService: IAdminVerificationService =
  new AdminVerificationService(adminVerificationRepository, instructorService);
const adminVerificationController: IAdminVerificationController =
  new AdminVerificationController(adminVerificationService, emailService);

/////////////////////////Instructor verification/////////////////////////////////////

import { IInstructorVerificationRepository } from "../repositories/instructorRepository/interface/IInstructorVerifcationRepository";
import { InstructorVerificationRepository } from "../repositories/instructorRepository/instructorVerificationRepository";
import { IInstructorVerificationService } from "../services/instructorServices/interface/IInstructorVerificationService";
import { InstructorVerificationService } from "../services/instructorServices/instructorVerificationService";
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
import { IStudentProfileRepository } from "../repositories/studentRepository/interface/IStudentProfileRepository";
import { IStudentProfileService } from "../services/studentServices/interface/IStudentProfileService";
import { StudentProfileService } from "../services/studentServices/studentProfileService";
import { IStudentProfileController } from "../controllers/studentControllers/interfaces/IStudentProfileController";
import { StudentProfileController } from "../controllers/studentControllers/studentProfileController";

const studentProfileRepo: IStudentProfileRepository =
  new studentProfileRepository();
const studentProfileService: IStudentProfileService = new StudentProfileService(
  studentProfileRepo,
);
const studentProfileController: IStudentProfileController =
  new StudentProfileController(studentProfileService);

////////////////////////INSTRUCTOR PROFILE MANAGEMENT/////////////////////////////////////////////////

import { IInstructorProfileRepository } from "../repositories/instructorRepository/interface/IInstructorProfileRepository";
import { InstructorProfileRepository } from "../repositories/instructorRepository/instructorProfileRepository";
import { IInstructorProfileService } from "../services/instructorServices/interface/IInstructorProfileService";
import { InstructorProfileService } from "../services/instructorServices/instructorProfileService";
import { IInstructorProfileController } from "../controllers/instructorController/interfaces/IInstructorProfileController";
import { InstructorProfileController } from "../controllers/instructorController/instructorProfileController";

const instructorProfileRepo: IInstructorProfileRepository =
  new InstructorProfileRepository();
const instructorProfileService: IInstructorProfileService =
  new InstructorProfileService(instructorProfileRepo);
const instructorProfileController: IInstructorProfileController =
  new InstructorProfileController(instructorProfileService, jwtService);

//////////////////////ADMIN CATEGORY CONTROLLER////////////////////////////////////////

import { IAdminCategoryRepository } from "../repositories/adminRepository/interface/IAdminCategoryRepository";
import { AdminCategoryRepository } from "../repositories/adminRepository/adminCateogyRepository";

import { IAdminCategoryService } from "../services/adminServices/interface/IAdminCategoryService";
import { AdminCategoryService } from "../services/adminServices/adminCategoryService";

import { IAdminCategoryController } from "../controllers/adminControllers/interface/IAdminCategoryController";
import { AdminCategoryContoller } from "../controllers/adminControllers/adminCategoryController";

const adminCategoryRepository: IAdminCategoryRepository =
  new AdminCategoryRepository();
const adminCategoryServie: IAdminCategoryService = new AdminCategoryService(
  adminCategoryRepository,
);
const adminCategoryController: IAdminCategoryController =
  new AdminCategoryContoller(adminCategoryServie);

///////////////////////INSTRUCTROR CATEGORY FETCH/////////////////////////////////////

import { IInstructorCategoryRepository } from "../repositories/instructorRepository/interface/IInstructorCategoryRepository";
import { InstructorCategoryRepository } from "../repositories/instructorRepository/instructorCategoryRepository";

import { IInstructorCategoryService } from "../services/instructorServices/interface/IInstructorCategoryService";
import { InstructorCategoryService } from "../services/instructorServices/instructorCategoryService";

import { IInstructorCategoryController } from "../controllers/instructorController/interfaces/IInstructorCategoryController";

import { InstructorCategoryController } from "../controllers/instructorController/instructorCategoryController";

const instructorCategoryRepository: IInstructorCategoryRepository =
  new InstructorCategoryRepository();

const instructorCategoryService: IInstructorCategoryService =
  new InstructorCategoryService(instructorCategoryRepository);

const instructorCategoryController: IInstructorCategoryController =
  new InstructorCategoryController(instructorCategoryService);

///////////////////////INSTRUCTOR CHAPTER CONTROLLER/////////////////////////////////////

import { IInstructorChapterRepository } from "../repositories/instructorRepository/interface/IInstructorChapterRepository";
import { InstructorChapterRepository } from "../repositories/instructorRepository/instructorChapterRepository";

import { IInstructorChapterService } from "../services/instructorServices/interface/IInstructorChapterService";
import { InstructorChapterService } from "../services/instructorServices/instructorChapterService";

import { IInstructorChapterController } from "../controllers/instructorController/interfaces/IInstructorChapterController";
import { InstructorChapterController } from "../controllers/instructorController/instructorChapterController";

const instructorChapterRepository: IInstructorChapterRepository =
  new InstructorChapterRepository();

const instructorChapterService: IInstructorChapterService =
  new InstructorChapterService(instructorChapterRepository);

const instructorChapterController: IInstructorChapterController =
  new InstructorChapterController(instructorChapterService);

/////////////////////////INSTRUCTOR QUIZ CONTROLLER////////////////////////////////////////////////////////////////////////////////////////////

import { IInstructorQuizRepository } from "../repositories/instructorRepository/interface/IInstructorQuizRepository";
import { InstructorQuizRepository } from "../repositories/instructorRepository/instructorQuizRepository";

import { IInstructorQuizService } from "../services/instructorServices/interface/IInstructorQuizService";
import { InstructorQuizService } from "../services/instructorServices/instructorQuizService";

import { IInstructorQuizController } from "../controllers/instructorController/interfaces/IInstructorQuizController";
import { InstructorQuizController } from "../controllers/instructorController/instructorQuizController";

const instructorQuizRepository: IInstructorQuizRepository =
  new InstructorQuizRepository();

const instructorQuizService: IInstructorQuizService = new InstructorQuizService(
  instructorQuizRepository,
);

const instructorQuizController: IInstructorQuizController =
  new InstructorQuizController(instructorQuizService);

//////////////////////INSTRUCTOR COURSE MANAGEMENT///////////////////////////////////////

import { IInstructorCourseRepository } from "../repositories/instructorRepository/interface/IInstructorCourseRepository";
import { InstructorCourseRepository } from "../repositories/instructorRepository/instructorCourseRepository";

import { IInstructorCourseService } from "../services/instructorServices/interface/IInstructorCourseService";
import { InstructorCourseService } from "../services/instructorServices/instructorCourseService";

import { IInstructorCourseController } from "../controllers/instructorController/interfaces/IInstructorCourseController";
import { InstructorCourseController } from "../controllers/instructorController/instructorCourseController";

const instructorCourseRepository: IInstructorCourseRepository =
  new InstructorCourseRepository();

const instructorCourseService: IInstructorCourseService =
  new InstructorCourseService(
    instructorCourseRepository,
    instructorChapterRepository,
    instructorQuizRepository,
  );

const instructorCourseController: IInstructorCourseController =
  new InstructorCourseController(instructorCourseService);

////////////////////////ADMIN COURSE CONTROLLER/////////////////////////////////////////////////////////////////////////////////////////////

import { IAdminCourseRepository } from "../repositories/adminRepository/interface/IAdminCourseRepository";
import { AdminCourseRepository } from "../repositories/adminRepository/adminCourseRepository";

import { IAdminCourseService } from "../services/adminServices/interface/IAdminCourseService";
import { AdminCourseService } from "../services/adminServices/adminCourseService";

import { IAdminCourseController } from "../controllers/adminControllers/interface/IAdminCourseController";
import { AdminCourseController } from "../controllers/adminControllers/adminCourseController";
import { ChapterDetailRepository } from "../repositories/ChapterRepository";
import { QuizDetailRepository } from "../repositories/QuizRepository";

const adminCourseRepository: IAdminCourseRepository = new AdminCourseRepository(
  new ChapterDetailRepository(),
  new QuizDetailRepository(),
);

const adminCourseService: IAdminCourseService = new AdminCourseService(
  adminCourseRepository,
);

const adminCourseController: IAdminCourseController = new AdminCourseController(
  adminCourseService,
);

///////////////////////////STUDENT COURSE CONTROLLER//////////////////////////////////////////////////////////////////////////////////////////

import { IChapterReadOnlyRepository } from "../repositories/interfaces/IChapterReadOnlyRepository";
import { ChapterReadOnlyRepository } from "../repositories/studentRepository/chapterReadOnlyRepository";

import { IQuizReadOnlyRepository } from "../repositories/interfaces/IQuizReadOnlyRepository";
import { QuizReadOnlyRepository } from "../repositories/studentRepository/quizReadOnlyRepository";

import { IStudentCourseRepository } from "../repositories/studentRepository/interface/IStudentCourseRepository";
import { StudentCourseRepository } from "../repositories/studentRepository/studentCourseRepository";

import { IStudentCourseService } from "../services/studentServices/interface/IStudentCourseService";
import { StudentCourseService } from "../services/studentServices/studentCourseService";

import { IStudentCourseController } from "../controllers/studentControllers/interfaces/IStudentCourseController";
import { StudentCourseController } from "../controllers/studentControllers/studentCourseController";

const chapterReadOnlyRepository: IChapterReadOnlyRepository =
  new ChapterReadOnlyRepository();
const quizReadOnlyRepository: IQuizReadOnlyRepository =
  new QuizReadOnlyRepository();

const studentCourseRepository: IStudentCourseRepository =
  new StudentCourseRepository(
    chapterReadOnlyRepository,
    quizReadOnlyRepository,
  );

const studentCourseService: IStudentCourseService = new StudentCourseService(
  studentCourseRepository,
);

const studentCourseController: IStudentCourseController =
  new StudentCourseController(studentCourseService);

///////////////////////CATEGORY READ ONLY CONTROLLER FOR STUDENT/////////////////////////////////////

import { ICategoryReadOnlyRepository } from "../repositories/interfaces/ICategoryReadOnlyRepository";
import { CategoryReadOnlyRepository } from "../repositories/studentRepository/CategoryReadOnlyRepository";
import { ICategoryReadOnlyService } from "../services/interface/ICategoryReadOnlyService";
import { CategoryReadOnlyService } from "../services/studentServices/categoryReadOnlyService";
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

import { IStudentCartService } from "../services/studentServices/interface/IStudentCartService";
import { StudentCartService } from "../services/studentServices/studentCartService";

import { IStudentCartController } from "../controllers/studentControllers/interfaces/IStudentCartController";
import { StudentCartController } from "../controllers/studentControllers/studentCartController";

const studentCartRepository: IStudentCartRepository =
  new StudentCartRepository();

const studentCartService: IStudentCartService = new StudentCartService(
  studentCartRepository,
);

const studentCartController: IStudentCartController = new StudentCartController(
  studentCartService,
);

///////////////////////STUDENT WISHLIST MANAGEMENT//////////////////////////////////////////////////////////////////////////////////////////////

import { IStudentWishlistRepository } from "../repositories/studentRepository/interface/IStudentWishlistRepository";
import { StudentWishlistRepository } from "../repositories/studentRepository/studentWishlistRepository";

import { IStudentWishlistService } from "../services/studentServices/interface/IStudentWishlistService";
import { StudentWishlistService } from "../services/studentServices/studentWishlistService";

import { IStudentWishlistController } from "../controllers/studentControllers/interfaces/IStudentWishlistController";
import { StudentWishlistController } from "../controllers/studentControllers/studentWishlistController";

const studentWishlistRepository: IStudentWishlistRepository =
  new StudentWishlistRepository();
const studentWishlistService: IStudentWishlistService =
  new StudentWishlistService(studentWishlistRepository);
const studentWishlistController: IStudentWishlistController =
  new StudentWishlistController(studentWishlistService);


/// coupon management ///

import { IStudentCouponRepo } from "../repositories/studentRepository/interface/IStudentCouponRepo";
import { StudentCouponRepo } from "../repositories/studentRepository/studentCouponRepo";

import { IStudentCouponService } from "../services/studentServices/interface/IStudentCouponService";
import { StudentCouponService } from "../services/studentServices/studentCouponService";

import { IStudentCouponController } from "../controllers/studentControllers/interfaces/IStudentCouponController";
import { StudentCouponController } from "../controllers/studentControllers/studentCouponController";


const studentCouponRepo : IStudentCouponRepo = new StudentCouponRepo()

const studentCouponService : IStudentCouponService = new StudentCouponService(studentCouponRepo)

const studentCouponController : IStudentCouponController = new StudentCouponController(studentCouponService)


/////////STUDENT CHECKOUT MANAGEMENT///////////////////

import { IStudentCheckoutRepository } from "../repositories/studentRepository/interface/IStudentCheckoutRepository";
import { StudentCheckoutRepository } from "../repositories/studentRepository/studentCheckoutRepository";

import { IStudentCheckoutService } from "../services/studentServices/interface/IStudentCheckoutService";
import { StudentCheckoutService } from "../services/studentServices/studentCheckoutService";

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
  adminRespository,
);

const studentCheckoutRepository: IStudentCheckoutRepository =
  new StudentCheckoutRepository(
    new OrderRepository(),
    new PaymentRepository(),
    new EnrollmentRepository(),
    new CourseRepository(),
  );

const studentCheckoutService: IStudentCheckoutService =
  new StudentCheckoutService(
    studentCheckoutRepository,
    studentCartRepository,
    walletService,
    studentCouponRepo
  );

const studentCheckoutController: IStudentCheckoutController =
  new StudentCheckoutController(studentCheckoutService);

////////////////////////DASHBOARD MANAGEMENT///////////////////////////////////

import { IInstructorAllCourseDashboardRepository } from "../repositories/instructorRepository/interface/IInstructorAllCourseDashboardRepository";
import { InstructorAllCourseDashboardRepository } from "../repositories/instructorRepository/instructorAllCourseDashboardRepository";

import { IInstructorAllCourseDashboardService } from "../services/instructorServices/interface/IInstructorAllDashboardService";
import { InstructorAllCourseDashboardService } from "../services/instructorServices/instructorAllDashboardService";

import { IInstructorAllDashboardController } from "../controllers/instructorController/interfaces/IInstructorAllDashboardController";
import { InstructorAllCourseDashboardController } from "../controllers/instructorController/instructorAllDashboardController";

import {
  GenericRepository,
  IGenericRepository,
} from "../repositories/genericRepository";
import { OrderModel, IOrder } from "../models/orderModel";
import { CourseModel, ICourse } from "../models/courseModel";

const orderRepo: IGenericRepository<IOrder> = new GenericRepository<IOrder>(
  OrderModel,
);

const courseRepo : IGenericRepository<ICourse> = new GenericRepository<ICourse>(CourseModel)



const instructorDashboardRepo: IInstructorAllCourseDashboardRepository =
  new InstructorAllCourseDashboardRepository(orderRepo,courseRepo);

const instructorDashboardService: IInstructorAllCourseDashboardService =
  new InstructorAllCourseDashboardService(instructorDashboardRepo);

const instructorDashboardController: IInstructorAllDashboardController =
  new InstructorAllCourseDashboardController(instructorDashboardService);

/////////////////////////INSTRUCTOR SPECIFIC COURSE DASHBOARD/////////////////////////////////////////////////////////////////////////////////////////////

import { IInstructorCourseSpecificDashboardRepository } from "../repositories/instructorRepository/interface/IInstructorSpecificCourseDashboardRepository";
import { InstructorSpecificCourseDashboardRepository } from "../repositories/instructorRepository/instructorSpecificCourseDashboardRepository";

import { IInstructorSpecificCourseDashboardService } from "../services/instructorServices/interface/IInstructorSpecificCourseService";
import { InstructorSpecificCourseDashboardService } from "../services/instructorServices/instructorSpecificCourseService";

import { IInstructorCourseSpecificDashboardController } from "../controllers/instructorController/interfaces/IInstructorSpecificCourseController";
import { InstructorSpecificCourseDashboardController } from "../controllers/instructorController/instructorSpecificCourseController";

const specificCourseDahboardRepository: IInstructorCourseSpecificDashboardRepository =
  new InstructorSpecificCourseDashboardRepository(
    new PaymentRepository(),
    new EnrollmentRepository(),
    new CourseRepository(),
    new OrderRepository(),
  );

const specificCourseDashboardService: IInstructorSpecificCourseDashboardService =
  new InstructorSpecificCourseDashboardService(
    specificCourseDahboardRepository,
  );

const specificCourseDashboardController: IInstructorCourseSpecificDashboardController =
  new InstructorSpecificCourseDashboardController(
    specificCourseDashboardService,
  );

///////////////////////////////////////////////////////////

import { IStudentEnrollmentRepository } from "../repositories/studentRepository/interface/IStudentEnrollmentRepository";
import { StudentEnrollmentRepository } from "../repositories/studentRepository/studentEnrollementRepository";

import { IStudentEnrollmentService } from "../services/studentServices/interface/IStudentEnrollmentService";
import { StudentEnrollmentService } from "../services/studentServices/studentEnrollmentService";

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
  walletService,
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
  walletService,
);

//Admin Wallet Payment//

import { IAdminWalletPaymentController } from "../controllers/adminControllers/interface/IAdminWalletPaymentController";
import { AdminWalletPaymentController } from "../controllers/adminControllers/adminWalletPaymentController";

const adminWalletPaymentController: IAdminWalletPaymentController =
  new AdminWalletPaymentController(walletPaymentService);

////student order history management/////////////

import { IStudentOrderRepository } from "../repositories/studentRepository/interface/IStudentOrderRepository";
import { StudentOrderRepository } from "../repositories/studentRepository/studentOrderRepository";

import { IStudentOrderService } from "../services/studentServices/interface/IStudentOrderService";
import { StudentOrderService } from "../services/studentServices/studentOrderService";

import { IStudentOrderController } from "../controllers/studentControllers/interfaces/IStudentOrderController";
import { StudentOrderController } from "../controllers/studentControllers/studentOrderController";

const studentOrderRepository: IStudentOrderRepository =
  new StudentOrderRepository();

const studentOrderService: IStudentOrderService = new StudentOrderService(
  studentOrderRepository,
  studentCheckoutService,
);

const studentOrderController: IStudentOrderController =
  new StudentOrderController(studentOrderService);

/////////ADMIN MEMEBERSHIP MANAGEMENT///////////////////////////////////////////

import { IAdminMembershipRepository } from "../repositories/adminRepository/interface/IAdminMembershipRepository";
import { AdminMembershipRepository } from "../repositories/adminRepository/adminMembershipRepository";
import { IAdminMembershipService } from "../services/adminServices/interface/IAdminMembershipService";
import { AdminMembershipService } from "../services/adminServices/adminMembershipService";
import { IAdminMembershipController } from "../controllers/adminControllers/interface/IAdminMembershipController";
import { AdminMembershipController } from "../controllers/adminControllers/adminMembershipController";

const adminMembershipRepository: IAdminMembershipRepository =
  new AdminMembershipRepository();

const adminMembershipService: IAdminMembershipService =
  new AdminMembershipService(adminMembershipRepository);

const adminMembershipController: IAdminMembershipController =
  new AdminMembershipController(adminMembershipService);

////////////instructor membership page/////////////////////////////////////////////

import { IInstructorMembershipRepository } from "../repositories/instructorRepository/interface/IInstructorMembershipRepository";
import { InstructorMembershipRepository } from "../repositories/instructorRepository/instructorMembershipRepository";

import { IInstructorMembershipService } from "../services/instructorServices/interface/IInstructorMembershipService";
import { InstructorMembershipService } from "../services/instructorServices/instructorMembershipService";

import { IInstructorMembershipController } from "../controllers/instructorController/interfaces/IInstructorMembershipController";
import { InstructorMembershipController } from "../controllers/instructorController/instructorMembershipController";

const instructorMembershipRepository: IInstructorMembershipRepository =
  new InstructorMembershipRepository();

const instructorMembershipService: IInstructorMembershipService =
  new InstructorMembershipService(
    instructorMembershipRepository,
    instructorRepository,
  );

const instructorMembershipController: IInstructorMembershipController =
  new InstructorMembershipController(instructorMembershipService);

//buying membership or instructor checkout

import { IInstructorMembershipOrderRepository } from "../repositories/instructorRepository/interface/IInstructorMembershipOrderRepository";
import { InstructorMembershipOrderRepository } from "../repositories/instructorRepository/instructorMembershipOrderRepository";

import { IInstructorMembershipOrderService } from "../services/instructorServices/interface/IInstructorMembershipOrderService";
import { InstructorMembershipOrderService } from "../services/instructorServices/instructorMembershipOrderService";

import { IInstructorMembershipOrderController } from "../controllers/instructorController/interfaces/IInstructorMembershipOrderController";
import { InstructorMembershipOrderController } from "../controllers/instructorController/instructorMembershipOrderController";
import { razorpay } from "../utils/razorpay";

const instructorMembershipOrderRepository: IInstructorMembershipOrderRepository =
  new InstructorMembershipOrderRepository();

const instructorMembershipOrderService: IInstructorMembershipOrderService =
  new InstructorMembershipOrderService(
    instructorMembershipOrderRepository,
    instructorMembershipRepository,
    instructorRepository,
    razorpay,
    walletService,
    emailService,
  );

const instructorMembershipOrderController: IInstructorMembershipOrderController =
  new InstructorMembershipOrderController(
    instructorMembershipOrderService,
    instructorMembershipService,
  );

/////////////////////ADMIN MEMBERSHIP ORDER MANAGEMENT/////////////////////////////////////

import { IAdminMembershipOrderRepository } from "../repositories/adminRepository/interface/IAdminMembershipOrderRepository";
import { AdminMembershipOrderRepository } from "../repositories/adminRepository/adminMembershipOrderRepository";

import { IAdminMembershipOrderService } from "../services/adminServices/interface/IAdminMembershipOrderService";
import { AdminMembershipOrderService } from "../services/adminServices/adminMembershipOrderService";

import { IAdminMembershipOrderController } from "../controllers/adminControllers/interface/IAdminMembershipOrderController";
import { AdminMembershipOrderController } from "../controllers/adminControllers/adminMembershipOrderController";

const adminMembershipOrderRepository: IAdminMembershipOrderRepository =
  new AdminMembershipOrderRepository();

const adminMembershipOrderService: IAdminMembershipOrderService =
  new AdminMembershipOrderService(adminMembershipOrderRepository);

const adminMembershipOrderController: IAdminMembershipOrderController =
  new AdminMembershipOrderController(adminMembershipOrderService);

///////////////SLOT MANAGEMENT////////////////////////////

import { IInstructorSlotRepository } from "../repositories/instructorRepository/interface/IInstructorSlotRepository";
import { InstructorSlotRepository } from "../repositories/instructorRepository/instructorSlotRepository";

import { IInstructorSlotService } from "../services/instructorServices/interface/IInstructorSlotService";
import { InstructorSlotService } from "../services/instructorServices/instructorSlotService";

import { IInstructorSlotController } from "../controllers/instructorController/interfaces/IInstructorSlotController";
import { InstructorSlotController } from "../controllers/instructorController/instructorSlotController";

const instructorSlotRepository: IInstructorSlotRepository =
  new InstructorSlotRepository();

const instructorSlotService: IInstructorSlotService = new InstructorSlotService(
  instructorSlotRepository,
);

const instructorSlotController: IInstructorSlotController =
  new InstructorSlotController(instructorSlotService);

////////////INSTRUCTOR LISTING ON STUDENT SIDE///////////

import { IStudentInstructorListingRepository } from "../repositories/studentRepository/interface/IStudentInstructorListingRepository";
import { StudentInstructorListingRepository } from "../repositories/studentRepository/studentInstructorListingRepository";

import { IStudentInstructorListingService } from "../services/studentServices/interface/IStudentInstructorListingService";
import { StudentInstructorListingService } from "../services/studentServices/studentInstructorListingService";

import { IStudentInstructorListingController } from "../controllers/studentControllers/interfaces/IStudentInstructorListingController";
import { StudentInstructorListingController } from "../controllers/studentControllers/studentInstructorListingController";

const studentInstructorListingRepository: IStudentInstructorListingRepository =
  new StudentInstructorListingRepository();

const studentInstructorListingService: IStudentInstructorListingService =
  new StudentInstructorListingService(studentInstructorListingRepository);

const studentInstructorListingController: IStudentInstructorListingController =
  new StudentInstructorListingController(studentInstructorListingService);

////student slot viewing////

import { IStudentSlotRepository } from "../repositories/studentRepository/interface/IStudentSlotRepository";
import { StudentSlotRepository } from "../repositories/studentRepository/StudentSlotRepository";

import { IStudentSlotService } from "../services/studentServices/interface/IStudentSlotService";
import { StudentSlotService } from "../services/studentServices/studentSlotService";

import { IStudentSlotController } from "../controllers/studentControllers/interfaces/IStudentSlotController";
import { StudentSlotController } from "../controllers/studentControllers/studentSlotController";

const studentSlotRepository: IStudentSlotRepository =
  new StudentSlotRepository();

const studentSlotService: IStudentSlotService = new StudentSlotService(
  studentSlotRepository,
);

const studentSlotController: IStudentSlotController = new StudentSlotController(
  studentSlotService,
);

///////////////////student slot booking managment//////////

import { IStudentSlotBookingRepository } from "../repositories/studentRepository/interface/IStudentSlotBookingRepository";
import { StudentSlotBookingRepository } from "../repositories/studentRepository/studentSlotBookingRepository";

import { IStudentSlotBookingService } from "../services/studentServices/interface/IStudentSlotBookingService";
import { StudentSlotBookingService } from "../services/studentServices/studentSlotBookingService";

import { IStudentSlotBookingController } from "../controllers/studentControllers/interfaces/IStudentSlotBookingController";
import { StudentSlotBookingController } from "../controllers/studentControllers/studentSlotBookingController";

const studentSlotBookingRepository: IStudentSlotBookingRepository =
  new StudentSlotBookingRepository();

const studentSlotBookingService: IStudentSlotBookingService =
  new StudentSlotBookingService(
    studentSlotBookingRepository,
    studentSlotRepository,
    walletService,
    emailService,
  );

const studentSlotBookingController: IStudentSlotBookingController =
  new StudentSlotBookingController(studentSlotBookingService);

////instructor viewing booked slot details//

import { IInstructorSlotBookingRepository } from "../repositories/instructorRepository/interface/IInstructorSlotBookingRepository";
import { InstructorSlotBookingRepository } from "../repositories/instructorRepository/instructorSlotBookingRepository";

import { IInstructorSlotBookingService } from "../services/instructorServices/interface/IInstructorSlotBookingService";
import { InstructorSlotBookingService } from "../services/instructorServices/instructorSlotBookingService";

import { IInstructorSlotBookingController } from "../controllers/instructorController/interfaces/IInstructorSlotBookingController";
import { InstructorSlotBookingController } from "../controllers/instructorController/instructorSlotBookingController";

const instructorSlotBookingRepository: IInstructorSlotBookingRepository =
  new InstructorSlotBookingRepository();

const instructorSlotBookingService: IInstructorSlotBookingService =
  new InstructorSlotBookingService(instructorSlotBookingRepository);

const instructorSlotBookingController: IInstructorSlotBookingController =
  new InstructorSlotBookingController(instructorSlotBookingService);

///////////////admin dashboard repository//////////////////

import { IAdminDashboardRepository } from "../repositories/adminRepository/interface/IAdminDashboardRepository";
import { AdminDashboardRepository } from "../repositories/adminRepository/adminDashboardRepository";

import { IAdminDashboardService } from "../services/adminServices/interface/IAdminDashboardService";
import { AdminDashboardService } from "../services/adminServices/adminDashboardService";

import { IAdminDashboardController } from "../controllers/adminControllers/interface/IAdminDashboardController";
import { AdminDashboardController } from "../controllers/adminControllers/adminDashboardController";

import { InstructorMembershipOrder } from "../../src/repositories/InstructorMemberShirpOrderRepository";

const adminDashboardRepository: IAdminDashboardRepository =
  new AdminDashboardRepository(
    instructorRepository,
    new CourseRepository(),
    new OrderRepository(),
    new InstructorMembershipOrder(),
  );

const adminDashboardService: IAdminDashboardService = new AdminDashboardService(
  adminDashboardRepository,
);

const adminDashboardController: IAdminDashboardController =
  new AdminDashboardController(adminDashboardService);

//////////////student dashboard repository//////////////////

import { IStudentDashboardRepository } from "../repositories/studentRepository/interface/IStudentDashboardRepository";
import { StudentDashboardRepository } from "../repositories/studentRepository/studentDashboardRepository";

import { IStudentDashboardService } from "../services/studentServices/interface/IStudentDashboardService";
import { StudentDashboardService } from "../services/studentServices/studentDashboardService";

import { IStudentDashboardController } from "../controllers/studentControllers/interfaces/IStudentDashboardController";
import { StudentDashboardController } from "../controllers/studentControllers/studentDashboardController";
import { BookingRepository } from "../repositories/BookingRepository";

const studentDashboardRepository: IStudentDashboardRepository =
  new StudentDashboardRepository(
    new EnrollmentRepository(),
    new BookingRepository(),
    new OrderRepository(),
  );

const studentDashboardService: IStudentDashboardService =
  new StudentDashboardService(studentDashboardRepository);

const studentDashboardController: IStudentDashboardController =
  new StudentDashboardController(studentDashboardService);

// instructor WithDrawal Request

import { IWithdrawalRequestRepository } from "../repositories/interfaces/IWithdrawalRequestRepository";
import { WithdrawalRequestRepository } from "../repositories/withdrawalRequestRepository";

import { IWithdrawalRequestService } from "../services/interface/IWithdrawalRequestService";
import { WithdrawalRequestService } from "../services/withdrawalRequestService";

import { IInstructorWithdrawalController } from "../controllers/instructorController/interfaces/IInstructorWithdrawalController";
import { InstructorWithdrawalController } from "../controllers/instructorController/instructorWithdrawalController";

const withdrawalRepo: IWithdrawalRequestRepository =
  new WithdrawalRequestRepository();

const withdrawalService: IWithdrawalRequestService =
  new WithdrawalRequestService(
    withdrawalRepo,
    walletService,
    instructorRepository,
  );

const instructorWithdrawalController: IInstructorWithdrawalController =
  new InstructorWithdrawalController(withdrawalService);

//admin withdrawal request

import { IAdminWithdrawalController } from "../controllers/adminControllers/interface/IAdminWithdrawalController";
import { AdminWithdrawalController } from "../controllers/adminControllers/adminWithdrawalController";

const adminWithdrawalController: IAdminWithdrawalController =
  new AdminWithdrawalController(withdrawalService);



//////////admin coupon management


import { IAdminCouponRepo } from "../repositories/adminRepository/interface/IAdminCouponRepo";
import { AdminCouponRepo } from "../repositories/adminRepository/adminCouponRepo";

import { IAdminCouponService } from "../services/adminServices/interface/IAdminCouponService";
import { AdminCouponService } from "../services/adminServices/adminCouponService";

import { IAdminCouponController } from "../controllers/adminControllers/interface/IAdminCouponController";
import { AdminCouponController } from "../controllers/adminControllers/adminCouponController";


const adminCouponRepo : IAdminCouponRepo = new AdminCouponRepo()

const adminCouponService : IAdminCouponService = new AdminCouponService(adminCouponRepo)

const adminCouponController : IAdminCouponController = new AdminCouponController(adminCouponService)













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
  //student coupon controller
  studentCouponController,
  //student checkout controller
  studentCheckoutController,
  //instructorDashaboard
  instructorDashboardController,
  //instructor specific dashboard controller
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

  //instructor slot
  instructorSlotBookingController,

  //admin dashboard controller
  adminDashboardController,

  //student dashboard controller
  studentDashboardController,

  //instructor withdrawal controller
  instructorWithdrawalController,

  //admin withdrawal controller
  adminWithdrawalController,

  //admin coupon controller
  adminCouponController,

  
};
