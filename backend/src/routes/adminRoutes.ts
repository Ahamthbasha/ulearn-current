import { Router } from "express";
import { adminController,adminVerificationController,adminCategoryController, adminCourseController, adminWalletController, adminWalletPaymentController, adminMembershipController, adminMembershipOrderController } from "../config/dependencyInjector";
import authenticateToken from "../middlewares/AuthenticatedRoutes";

import { isAdmin } from "../middlewares/roleAuth";

let router = Router()

router.post("/login",adminController.login.bind(adminController))
router.post("/logout",adminController.logout.bind(adminController))

//get all users and instructors
router.get("/getAllUsers",authenticateToken,isAdmin,adminController.getAllUsers.bind(adminController))
router.get("/getAllInstructors",authenticateToken,isAdmin,adminController.getAllInstructors.bind(adminController))

//block or unblock
router.get('/blockUser/:email',authenticateToken,isAdmin,adminController.blockUser.bind(adminController))
router.get('/blockInstructor/:email',authenticateToken,isAdmin,adminController.blockInstructor.bind(adminController))

//verification  routes
router.get('/request/:email',isAdmin,adminVerificationController.getRequestData.bind(adminVerificationController))

router.get("/requests",isAdmin,adminVerificationController.getAllRequests.bind(adminVerificationController))

router.post("/approveRequest",isAdmin,adminVerificationController.approveRequest.bind(adminVerificationController))

//category routes

router.get('/categories',authenticateToken,isAdmin,adminCategoryController.getAllCategory.bind(adminCategoryController))

router.get('/category/:categoryId',authenticateToken,isAdmin,adminCategoryController.findCategoryById.bind(adminCategoryController))

router.put('/categoryListOrUnlist/:id',authenticateToken,isAdmin,adminCategoryController.listOrUnlistCategory.bind(adminCategoryController))

router.post('/category',authenticateToken,isAdmin,adminCategoryController.addCategory.bind(adminCategoryController))

router.put('/category',authenticateToken,isAdmin,adminCategoryController.editCategory.bind(adminCategoryController))

//Course management

router.get("/courses",authenticateToken,isAdmin,adminCourseController.getAllCourses.bind(adminCourseController))

router.patch('/courses/:courseId/listing',authenticateToken,isAdmin,adminCourseController.updateListingStatus.bind(adminCourseController))

// wallet related routes

router.get('/wallet',authenticateToken,isAdmin,adminWalletController.getWallet.bind(adminWalletController))

router.post('/wallet/credit',authenticateToken,isAdmin,adminWalletController.creditWallet.bind(adminWalletController))

router.post('/wallet/debit',authenticateToken,isAdmin,adminWalletController.debitWallet.bind(adminWalletController))

router.get('/wallet/transactions',authenticateToken,isAdmin,adminWalletController.getTransactions.bind(adminWalletController))

// wallet payment related routes

router.post('/wallet/payment/createOrder',authenticateToken,isAdmin,adminWalletPaymentController.createOrder.bind(adminWalletPaymentController))

router.post('/wallet/payment/verify',authenticateToken,isAdmin,adminWalletPaymentController.verifyPayment.bind(adminWalletPaymentController))

//member management route

router.post('/membershipPlan',authenticateToken,isAdmin,adminMembershipController.createPlan.bind(adminMembershipController))

router.put('/membershipPlan/:membershipId',authenticateToken,isAdmin,adminMembershipController.updatePlan.bind(adminMembershipController))

router.delete('/membershipPlan/:membershipId',authenticateToken,isAdmin,adminMembershipController.deletePlan.bind(adminMembershipController))

router.get('/membershipPlan/:membershipId',authenticateToken,isAdmin,adminMembershipController.getPlanById.bind(adminMembershipController))

router.get('/membershipPlans',authenticateToken,isAdmin,adminMembershipController.getAllPlans.bind(adminMembershipController))

router.patch("/membershipPlan/:membershipId/toggleStatus",adminMembershipController.toggleStatus.bind(adminMembershipController))

///membership purchase history management

router.get("/membershipPurchaseHistory",authenticateToken,isAdmin,adminMembershipOrderController.getAllOrders.bind(adminMembershipOrderController))

router.get("/membershipPurchaseHistory/:txnId",authenticateToken,isAdmin,adminMembershipOrderController.getOrderDetail.bind(adminMembershipOrderController))

const adminRoutes = router

export default adminRoutes