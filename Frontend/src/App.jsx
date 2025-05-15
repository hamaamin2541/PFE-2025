import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import ModalForm from './components/Auth/ModalConnexion';
import ChatBubble from './components/Chat/ChatBubble';
import Chatbot from './components/Chat/Chatbot';
import { StudentProvider } from './context/StudentContext';
import { FormationProvider } from './context/FormationContext';
import { TeacherProvider } from './context/TeacherContext';

// Pages d'authentification
import SeConnecter from './components/Auth/SeConnecter';
import Register from './components/Auth/Register';

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

// User Components
import UserComplaints from './pages/User/UserComplaints';

function App() {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <StudentProvider>
      <FormationProvider>
        <TeacherProvider>
          <BrowserRouter>
            <div className="app-container">
              <Navbar onShowModal={handleShowModal} />

              <Routes>
                <Route path="/" element={<Navigate to="/Accueil" />} />
                <Route path="/Accueil" element={<Accueil onShowModal={handleShowModal} />} />
                <Route path="/Contact" element={<Contact />} />
                <Route path="/NotreContenu" element={<NotreContenu />} />
                <Route path="/NosProfesseurs" element={<NosProfesseurs />} />
                <Route path="/SeConnecter" element={<SeConnecter onCloseModal={handleCloseModal} />} />
                <Route path="/Register" element={<Register />} />
                <Route path="/dashboard-student" element={<DashboardStudent />} />
                <Route path="/dashboard-student/complaints" element={<UserComplaints />} />
                <Route path="/course/:enrollmentId" element={<CourseView />} />
                <Route path="/formation/:enrollmentId" element={<FormationView />} />
                <Route path="/test/:enrollmentId" element={<TestView />} />
                <Route path="/dashboard-teacher" element={<DashboardTeacher />} />
                <Route path="/dashboard-teacher/edit-course/:id" element={<EditCourse />} />
                <Route path="/dashboard-teacher/edit-test/:id" element={<EditTest />} />
                <Route path="/dashboard-teacher/edit-formation/:id" element={<EditFormation />} />

                //yetregrlou
            <Route path="/checkout" element={<Checkout />} />
                  <Route path="/success" element={<Success />} />
                  <Route path="/cancel"  element={<Cancel />} />
                {/* Routes d'administration */}
                <Route path="/admin" element={<AdminLayout />}>
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
                </Route>

                <Route path="*" element={<Navigate to="/Accueil" />} />
              </Routes>

              <ModalForm show={showModal} handleClose={handleCloseModal} />
              <Chatbot />
              <ChatBubble />
            </div>
          </BrowserRouter>
        </TeacherProvider>
      </FormationProvider>
    </StudentProvider>
  );
}

export default App;