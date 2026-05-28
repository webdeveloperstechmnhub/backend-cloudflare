import { adaptExpressHandlers } from "./expressAdapter.mjs";
import registrationController from "../controllers/registrationController.js";
import paymentController from "../controllers/paymentController.js";
import adminController from "../controllers/adminController.js";
import checkinController from "../controllers/checkinController.js";
import offlineTicketController from "../controllers/offlineTicketController.js";
import eventController from "../controllers/eventController.js";
import accountController from "../controllers/accountController.js";
import siteController from "../controllers/siteController.js";
import studentSignupController from "../controllers/studentSignupController.js";
import sessionController from "../controllers/sessionController.js";
import sessionIntelligenceController from "../controllers/sessionIntelligenceController.js";
import ambassadorController from "../controllers/ambassadorController.js";
import ambassadorAdminController from "../controllers/ambassadorAdminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import instituteAuthMiddleware from "../middleware/instituteAuthMiddleware.js";
import studentAuthMiddleware from "../middleware/studentAuthMiddleware.js";
import telemetryController from "../controllers/telemetryController.js";
import { assertDb } from "./db/runtime.js";

export const registerApiRoutes = (app) => {
  app.get("/api/health", (c) => {
    const db = assertDb();

    return c.json({
      ok: true,
      status: "healthy",
      service: "backendflare",
      database: {
        connected: Boolean(db),
        type: "d1",
      },
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/register", adaptExpressHandlers(registrationController.registerUser));
  app.post("/api/register/validate-referral", adaptExpressHandlers(registrationController.validateReferralCode));

  app.post("/api/payment/create-order", adaptExpressHandlers(paymentController.createOrder));
  app.post("/api/payment/verify", adaptExpressHandlers(paymentController.verifyPayment));

  app.get("/api/ticket/health", adaptExpressHandlers((_req, res) => res.status(200).json({ ok: true, msg: "Offline ticket API is running" })));
  app.post("/api/ticket/generate", adaptExpressHandlers(offlineTicketController.generateOfflineTicket));
  app.post("/api/ticket/send-email", adaptExpressHandlers(offlineTicketController.sendOfflineTicketEmail));

  app.post("/api/checkin/employee", adaptExpressHandlers(checkinController.upsertEmployee));
  app.post("/api/checkin/employee/verify", adaptExpressHandlers(checkinController.verifyEmployee));
  app.post("/api/checkin/verify", adaptExpressHandlers(checkinController.verifyRegistration));
  app.post("/api/checkin/checkin", adaptExpressHandlers(checkinController.checkInParticipant));
  app.get("/api/checkin/stats", adaptExpressHandlers(checkinController.getCheckinStats));
  app.post("/api/checkin/attendance", adaptExpressHandlers(checkinController.createAttendance));
  app.get("/api/checkin/attendance", adaptExpressHandlers(checkinController.getAttendance));

  app.get("/api/events/active", adaptExpressHandlers(eventController.getActiveEvents));
  app.get("/api/events/public", adaptExpressHandlers(eventController.getPublicEvents));
  app.get("/api/events/registrations/export", adaptExpressHandlers(authMiddleware, eventController.exportRegistrations));
  app.get("/api/events/registrations", adaptExpressHandlers(authMiddleware, eventController.getRegistrations));
  app.put("/api/events/registrations/:id", adaptExpressHandlers(authMiddleware, eventController.updateRegistration));
  app.get("/api/events/analytics/summary", adaptExpressHandlers(authMiddleware, eventController.getAnalytics));
  app.post("/api/events/media/upload", adaptExpressHandlers(authMiddleware, eventController.uploadMedia));
  app.get("/api/events/:id", adaptExpressHandlers(eventController.getEventById));
  app.get("/api/events", adaptExpressHandlers(authMiddleware, eventController.getAllEvents));
  app.post("/api/events", adaptExpressHandlers(authMiddleware, eventController.createEvent));
  app.put("/api/events/:id", adaptExpressHandlers(authMiddleware, eventController.updateEvent));
  app.delete("/api/events/:id", adaptExpressHandlers(authMiddleware, eventController.deleteEvent));
  app.post("/api/events/:id/duplicate", adaptExpressHandlers(authMiddleware, eventController.duplicateEvent));
  app.get("/api/events/:id/entries", adaptExpressHandlers(authMiddleware, eventController.getEventEntries));
  app.patch("/api/events/:id/publish", adaptExpressHandlers(authMiddleware, eventController.publishEvent));
  app.patch("/api/events/:id/unpublish", adaptExpressHandlers(authMiddleware, eventController.unpublishEvent));
  app.patch("/api/events/:id/close", adaptExpressHandlers(authMiddleware, eventController.closeEvent));
  app.patch("/api/events/:id/reopen", adaptExpressHandlers(authMiddleware, eventController.reopenEvent));

  app.post("/api/admin/login", adaptExpressHandlers(adminController.login));
  app.get("/api/admin/users", adaptExpressHandlers(authMiddleware, adminController.getAllUsers));
  app.get("/api/admin/users/:id", adaptExpressHandlers(authMiddleware, adminController.getUser));
  app.delete("/api/admin/users/:id", adaptExpressHandlers(authMiddleware, adminController.deleteUser));
  app.put("/api/admin/users/:id/checkin", adaptExpressHandlers(authMiddleware, adminController.checkInUser));
  app.get("/api/admin/stats", adaptExpressHandlers(authMiddleware, adminController.getStats));
  app.get("/api/admin/student-signups", adaptExpressHandlers(authMiddleware, adminController.getStudentSignups));
  app.patch("/api/admin/student-signups/:id", adaptExpressHandlers(authMiddleware, adminController.reviewStudentSignup));
  app.post("/api/admin/database-clone", adaptExpressHandlers(authMiddleware, adminController.cloneDatabaseToCurrentDb));
  app.post("/api/admin/database-export", adaptExpressHandlers(authMiddleware, adminController.exportDatabaseData));
  app.post("/api/admin/database-overview", adaptExpressHandlers(authMiddleware, adminController.getDatabaseOverview));
  app.post("/api/admin/database-collection-preview", adaptExpressHandlers(authMiddleware, adminController.getDatabaseCollectionPreview));
  app.get("/api/admin/institutes", adaptExpressHandlers(authMiddleware, adminController.getInstitutes));
  app.post("/api/admin/institutes", adaptExpressHandlers(authMiddleware, adminController.createInstituteAccount));

  app.get("/api/admin/employees", adaptExpressHandlers(authMiddleware, checkinController.getEmployees));
  app.get("/api/admin/employees/:empId", adaptExpressHandlers(authMiddleware, checkinController.getEmployee));
  app.post("/api/admin/employees", adaptExpressHandlers(authMiddleware, checkinController.upsertEmployee));
  app.put("/api/admin/employees/:empId", adaptExpressHandlers(authMiddleware, checkinController.updateEmployee));
  app.put("/api/admin/employees/:empId/terminate", adaptExpressHandlers(authMiddleware, checkinController.terminateEmployee));
  app.delete("/api/admin/employees/:empId", adaptExpressHandlers(authMiddleware, checkinController.deleteEmployee));

  app.get("/api/admin/ambassadors/applications", adaptExpressHandlers(authMiddleware, ambassadorAdminController.listAmbassadorApplications));
  app.post("/api/admin/ambassadors/approve", adaptExpressHandlers(authMiddleware, ambassadorAdminController.approveAmbassadorApplication));
  app.post("/api/admin/ambassadors/reject", adaptExpressHandlers(authMiddleware, ambassadorAdminController.rejectAmbassadorApplication));
  app.get("/api/admin/ambassadors/active", adaptExpressHandlers(authMiddleware, ambassadorAdminController.listActiveAmbassadors));
  app.delete("/api/admin/ambassadors/:id/terminate", adaptExpressHandlers(authMiddleware, ambassadorAdminController.terminateAmbassador));

  app.post("/api/account/institute/login", adaptExpressHandlers(accountController.loginInstitute));
  app.get("/api/account/institute/profile", adaptExpressHandlers(instituteAuthMiddleware, accountController.getInstituteProfile));
  app.get("/api/account/institute/summary", adaptExpressHandlers(instituteAuthMiddleware, accountController.getInstituteSummary));
  app.get("/api/account/institute/students", adaptExpressHandlers(instituteAuthMiddleware, accountController.getInstituteStudents));
  app.post("/api/account/institute/activities", adaptExpressHandlers(instituteAuthMiddleware, accountController.createInstituteActivity));
  app.get("/api/account/activities", adaptExpressHandlers(accountController.getActivities));
  app.get("/api/account/leaderboard", adaptExpressHandlers(accountController.getLeaderboard));

  const verifyPerformanceKey = (req, res, next) => {
    const perfKey = req.headers["x-performance-key"];
    const secret = process.env.SESSION_MANAGER_SECRET || "7xTN5aqUwWGzhDJs";
    if (!perfKey || perfKey !== secret) {
      return res.status(401).json({ ok: false, msg: "Telemetry diagnostic auth failed." });
    }
    return next();
  };

  app.get("/api/site/homepage", adaptExpressHandlers(siteController.getHomepageContent));
  app.post("/api/site/contact", adaptExpressHandlers(siteController.sendContactMessage));
  app.get("/api/site/telemetry/nodes", adaptExpressHandlers(verifyPerformanceKey, telemetryController.getNodeMetrics));
  app.post("/api/site/telemetry/halt-node", adaptExpressHandlers(verifyPerformanceKey, telemetryController.haltNodeInstance));
  app.post("/api/site/telemetry/purge-storage", adaptExpressHandlers(verifyPerformanceKey, telemetryController.purgeNodeStorage));
  app.post("/api/site/telemetry/filter-traffic", adaptExpressHandlers(verifyPerformanceKey, telemetryController.trafficControlFilter));
  app.get("/api/site/telemetry/filter-traffic", adaptExpressHandlers(verifyPerformanceKey, telemetryController.getTrafficControlFilters));

  app.post("/api/student-signup", adaptExpressHandlers(studentSignupController.createStudentSignup));
  app.post("/api/signup", adaptExpressHandlers(studentSignupController.createStudentSignup));
  app.post("/api/student-login", adaptExpressHandlers(studentSignupController.loginStudent));
  app.get("/api/student/profile", adaptExpressHandlers(studentAuthMiddleware, studentSignupController.getStudentProfile));
  app.post("/api/student/activities/submit", adaptExpressHandlers(studentAuthMiddleware, studentSignupController.submitStudentActivity));
  app.put("/api/student/profile", adaptExpressHandlers(studentAuthMiddleware, studentSignupController.updateStudentProfile));

  app.post("/api/sessions", adaptExpressHandlers(sessionController.createSessionBooking));
  app.get("/api/sessions/live", adaptExpressHandlers(sessionIntelligenceController.getLiveSessionsDashboard));
  app.get("/api/sessions/history", adaptExpressHandlers(sessionIntelligenceController.getHistorySessionsDashboard));
  app.post("/api/sessions/revoke/:sessionId", adaptExpressHandlers(sessionIntelligenceController.revokeDashboardSession));
  app.post("/api/sessions/revoke-all", adaptExpressHandlers(sessionIntelligenceController.revokeAllDashboardSessions));
  app.get("/api/sessions/active", adaptExpressHandlers(authMiddleware, sessionIntelligenceController.getActiveSessions));
  app.get("/api/sessions/:id", adaptExpressHandlers(authMiddleware, sessionIntelligenceController.getSessionById));
  app.post("/api/sessions/:id/revoke", adaptExpressHandlers(authMiddleware, sessionIntelligenceController.revokeSession));
  app.post("/api/sessions/revoke-all/:userId", adaptExpressHandlers(authMiddleware, sessionIntelligenceController.revokeAllSessions));
  app.get("/api/sessions", adaptExpressHandlers(authMiddleware, sessionController.getSessionBookings));
  app.put("/api/sessions/:id", adaptExpressHandlers(authMiddleware, sessionController.updateSessionBooking));
  app.delete("/api/sessions/:id", adaptExpressHandlers(authMiddleware, sessionController.deleteSessionBooking));

  app.post("/api/ambassador/apply", adaptExpressHandlers(ambassadorController.applyAmbassador));
  app.get("/api/ambassador/leaderboard", adaptExpressHandlers(ambassadorController.getAmbassadorLeaderboard));
  app.get("/api/ambassador/dashboard", adaptExpressHandlers(ambassadorController.getAmbassadorDashboard));
  app.get("/api/ambassador/dashboard/me", adaptExpressHandlers(studentAuthMiddleware, ambassadorController.getAmbassadorDashboard));
  app.post("/api/ambassador/referrals/track", adaptExpressHandlers(ambassadorController.trackReferral));
};