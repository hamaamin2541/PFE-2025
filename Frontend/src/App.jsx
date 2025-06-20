import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import ModalForm from './components/Auth/ModalConnexion';
import ChatBubble from './components/Chat/ChatBubble';
import Chatbot from './components/Chat/Chatbot';
import { StudentProvider } from './context/StudentContext';
import { FormationProvider } from './context/FormationContext';
import { TeacherProvider } from './context/TeacherContext';
import { GamificationProvider } from './context/GamificationContext';
import { StudyTimeProvider } from './context/StudyTimeContext';
import CertificateVerification from './pages/CertificateVerification';
import QuestionDetail from './components/CourseQA/QuestionDetail';

// Route protection components
import PrivateRoute from './components/Auth/PrivateRoute';
import RoleBasedRoute from './components/Auth/RoleBasedRoute';

// Pages d'authentification
import SeConnecter from './components/Auth/SeConnecter';
import Register from './components/Auth/Register';
import MotDePasseOublie from './components/Auth/MotDePasseOublie';
import ResetPassword from './components/Auth/ResetPassword';
import VerifyAccount from './components/Auth/VerifyAccount';
import TestResetPassword from './components/Auth/TestResetPassword';

// Pages publiques
import Accueil from './components/Accueil/Accueil';
import Contact from './components/Contact/Contact';
import FAQ from './components/FAQ';
import NotreContenu from './pages/NotreContenu';
import NosProfesseurs from './pages/NosProfesseurs';

// Tableaux de bord
import DashboardStudent from './pages/Students/DashboardStudent';
import DashboardTeacher from './pages/Teacher/DashboardTeacher';

// Pages étudiant
import MesCours from './pages/Students/MesCours';
import CourseView from './pages/Students/CourseView';
import FormationView from './pages/Students/FormationView';
import TestView from './pages/Students/TestView';
import Tests from './pages/Students/Tests';
import Messages from './pages/Students/Messages';
import Parametres from './pages/Students/Parametres';
import MesCertificats from './pages/Students/MesCertificats';
import StudySession from './pages/Students/StudySession';

// Pages professeur
import TeacherMessages from './pages/Teacher/TeacherMessages';
import { TeacherAnalytics } from './pages/Teacher/TeacherAnalytics';
import AddCourse from './pages/Teacher/AddCourse';
import AddFormation from './pages/Teacher/AddFormation';
import AddTextAdvice from './pages/Teacher/conseiltest/AddTextAdvice';
import AddVideoAdvice from './pages/Teacher/conseiltest/AddVideoAdvice';
import AddTest from './pages/Teacher/conseiltest/AddTest';
import EditCourse from './pages/Teacher/EditCourse';
import EditTest from './pages/Teacher/EditTest';
import EditFormation from './pages/Teacher/EditFormation';
import Checkout from './components/Payment/Checkout';
import Success  from './components/Payment/Success';
import Cancel   from './components/Payment/Cancel';
// Admin Components
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import UserManagement from './pages/Admin/UserManagement';
import ComplaintManagement from './pages/Admin/ComplaintManagement';
import ContactMessageManagement from './pages/Admin/ContactMessageManagement';
import MessageManagement from './pages/Admin/MessageManagement';
import SettingsManagement from './pages/Admin/SettingsManagement';
import ExportsManagement from './pages/Admin/ExportsManagement';
import ReportsManagement from './pages/Admin/ReportsManagement';
import ContentManagement from './pages/Admin/Content/ContentManagement';
import TestimonialManagement from './pages/Admin/TestimonialManagement';
import AssistantManagement from './components/Admin/AssistantManagement';
import CommunityWallManagement from './pages/Admin/CommunityWallManagement';

// User Components
import UserComplaints from './pages/User/UserComplaints';
import CommunityWall from './pages/CommunityWall';
import TeacherRevenueDashboard from "./pages/Admin/TeacherRevenueDashboard.jsx";

function App() {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <StudentProvider>
      <FormationProvider>
        <TeacherProvider>
          <GamificationProvider>
            <StudyTimeProvider>
              <BrowserRouter>
                <div className="app-container">
                  <Navbar onShowModal={handleShowModal} />

              <Routes>
                {/* Public Routes - Accessible to everyone */}
                <Route path="/" element={<Navigate to="/Accueil" />} />
                <Route path="/Accueil" element={<Accueil onShowModal={handleShowModal} />} />
                <Route path="/Contact" element={<Contact />} />
                <Route path="/NotreContenu" element={<NotreContenu />} />
                <Route path="/NosProfesseurs" element={<NosProfesseurs />} />
                <Route path="/SeConnecter" element={<SeConnecter onCloseModal={handleCloseModal} />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/verify-account" element={<VerifyAccount />} />
                <Route path="/verify/certificate/:certificateId" element={<CertificateVerification />} />
                <Route path="/test-reset-password" element={<TestResetPassword />} />

                {/* Community Wall - Protected for authenticated users */}
                <Route
                  path="/community-wall"
                  element={
                    <PrivateRoute>
                      <CommunityWall />
                    </PrivateRoute>
                  }
                />

                {/* Student Routes - Protected for students */}
                <Route
                  path="/dashboard-student"
                  element={
                    <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin', 'assistant']} redirectPath="/">
                      <DashboardStudent />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/dashboard-student/complaints"
                  element={
                    <RoleBasedRoute allowedRoles={['student', 'teacher', 'admin', 'assistant']} redirectPath="/">
                      <UserComplaints />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/course/:enrollmentId"
                  element={
                    <PrivateRoute>
                      <CourseView />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/formation/:enrollmentId"
                  element={
                    <PrivateRoute>
                      <FormationView />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/test/:enrollmentId"
                  element={
                    <PrivateRoute>
                      <TestView />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/mes-certificats"
                  element={
                    <PrivateRoute>
                      <MesCertificats />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/study-session/:sessionId"
                  element={
                    <PrivateRoute>
                      <StudySession />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/course-question/:questionId"
                  element={
                    <PrivateRoute>
                      <QuestionDetail />
                    </PrivateRoute>
                  }
                />

                {/* Teacher Routes - Protected for teachers */}
                <Route
                  path="/dashboard-teacher"
                  element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin']} redirectPath="/">
                      <DashboardTeacher />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/dashboard-teacher/edit-course/:id"
                  element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin']} redirectPath="/">
                      <EditCourse />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/dashboard-teacher/edit-test/:id"
                  element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin']} redirectPath="/">
                      <EditTest />
                    </RoleBasedRoute>
                  }
                />
                <Route
                  path="/dashboard-teacher/edit-formation/:id"
                  element={
                    <RoleBasedRoute allowedRoles={['teacher', 'admin']} redirectPath="/">
                      <EditFormation />
                    </RoleBasedRoute>
                  }
                />

                {/* Payment Routes - Protected for students */}
                <Route
                  path="/checkout"
                  element={
                    <RoleBasedRoute allowedRoles={['student']} redirectPath="/">
                      <Checkout />
                    </RoleBasedRoute>
                  }
                />
                <Route path="/success" element={<Success />} />
                <Route path="/cancel" element={<Cancel />} />

                {/* Admin Routes - Protected for admins */}
                <Route
                  path="/admin"
                  element={
                    <RoleBasedRoute allowedRoles={['admin']} redirectPath="/">
                      <AdminLayout />
                    </RoleBasedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="users/new" element={<UserManagement newUser={true} />} />
                  <Route path="complaints" element={<ComplaintManagement />} />
                  <Route path="contact" element={<ContactMessageManagement />} />
                  <Route path="courses" element={<ContentManagement />} />
                  <Route path="tests" element={<ContentManagement />} />
                  <Route path="formations" element={<ContentManagement />} />
                  <Route path="messages" element={<MessageManagement />} />
                  <Route path="reports" element={<ReportsManagement />} />
                  <Route path="reports/users" element={<ReportsManagement />} />
                  <Route path="reports/sales" element={<ReportsManagement />} />
                  <Route path="reports/content" element={<ReportsManagement />} />
                  <Route path="database" element={<Navigate to="/admin/dashboard" />} />
                  <Route path="exports" element={<ExportsManagement />} />
                  <Route path="settings" element={<SettingsManagement />} />
                  <Route path="profile" element={<Navigate to="/admin/dashboard" />} />
                  <Route path="user-experiences" element={<TestimonialManagement />} />
                  <Route path="assistants" element={<AssistantManagement />} />
                  <Route path="community-wall" element={<CommunityWallManagement />} />
                    <Route path="prof" element={<TeacherRevenueDashboard/>}/>
                </Route>

                <Route path="*" element={<Navigate to="/Accueil" />} />
              </Routes>

              <ModalForm show={showModal} handleClose={handleCloseModal} />
              <Chatbot />
              <ChatBubble />
            </div>
          </BrowserRouter>
          </StudyTimeProvider>
          </GamificationProvider>
        </TeacherProvider>
      </FormationProvider>
    </StudentProvider>
  );
}

export default App;