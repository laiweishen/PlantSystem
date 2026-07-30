import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ScrollToTop from './components/scrollToTop';
import { ProtectedRoute, AdminRoute } from './components/protectedRoute';
import './App.css';

import HomePage from './pages/user/homePage';
import ResetPassword from './pages/user/resetPassword';
import PlantRecognition from './pages/user/plantRecognition';
import QuizPage from './pages/user/interactiveLearning';
import DiseaseDetection from './pages/user/diseaseDetection';
import Profile from './pages/user/profilePage';
import LoginPage from './pages/user/loginPage';
import PlantDetails from './pages/user/plantDetails';
import DiseaseDetails from './pages/user/diseaseDetails';
import PlantDetailViewPage from './pages/user/plantDetailsView';
import DiseaseDetailView from './pages/user/diseaseDetailsView';
import QuizTaking from './pages/user/quizTaking';
import QuizResults from './pages/user/quizResults';
import QuizHistory from './pages/user/quizHistory';
import QuizReview from './pages/user/quizReview';
import Bookmarks from './pages/user/bookmark';
import AdminManagement from './pages/admin/adminManagement';
import AdminOverview from './pages/admin/adminOverview';
import QuizManagement from './pages/admin/quizManagement';
import CreateQuiz from './pages/admin/createQuiz';
import ViewQuiz from './pages/admin/viewQuiz';
import EditQuiz from './pages/admin/editQuiz';
import LearningMaterial from './pages/admin/learningMaterial';
import CreateMaterial from './pages/admin/createMaterial';
import ViewMaterial from './pages/admin/viewMaterial';
import EditMaterial from './pages/admin/editMaterial';
import ViewLearningMaterial from './pages/user/viewLearningMaterial';
import ViewDetailsLearningMaterial from './pages/user/viewDetailsLearningMaterial';
import ScanHistory from './pages/user/scanHistory';
import ScanDetailView from './pages/user/scanDetailView';
import AdminAnalytics from './pages/admin/adminAnalysis';

function AppContent() {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("fadeIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("fadeOut");
    }
  }, [location, displayLocation]);

  return (
    <>
      <ScrollToTop />
      <div
        className={`app ${transitionStage}`}
        onAnimationEnd={() => {
          if (transitionStage === "fadeOut") {
            setTransitionStage("fadeIn");
            setDisplayLocation(location);
          }
        }}
      >
        
        <Routes location={displayLocation}>
          {/* ========== PUBLIC ROUTES ========== */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ========== PROTECTED USER ROUTES ========== */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />

          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Bookmarks />
            </ProtectedRoute>
          } />

          <Route path="/quiz" element={
            <ProtectedRoute>
              <QuizPage />
            </ProtectedRoute>
          } />

          <Route path="/scan-history" element={
            <ProtectedRoute>
              <ScanHistory />
            </ProtectedRoute>
          } />

          <Route path="/scan/:scanId" element={
            <ProtectedRoute>
              <ScanDetailView />
            </ProtectedRoute>
          } />

          <Route path="/quiz-taking" element={
            <ProtectedRoute>
              <QuizTaking />
            </ProtectedRoute>
          } />

          <Route path="/quiz-taking/:quizId" element={
            <ProtectedRoute>
              <QuizTaking />
            </ProtectedRoute>
          } />

          <Route path="/quiz-results" element={
            <ProtectedRoute>
              <QuizResults />
            </ProtectedRoute>
          } />

          <Route path="/quiz-history" element={
            <ProtectedRoute>
              <QuizHistory />
            </ProtectedRoute>
          } />

          <Route path="/quiz-review/:resultId" element={
            <ProtectedRoute>
              <QuizReview />
            </ProtectedRoute>
          } />



          <Route path="/diseaseRecognition" element={
            <ProtectedRoute>
              <DiseaseDetection />
            </ProtectedRoute>
          } />

          <Route path="/diseaseDetails" element={
            <ProtectedRoute>
              <DiseaseDetails />
            </ProtectedRoute>
          } />

          <Route path="/disease/:diseaseId" element={
            <ProtectedRoute>
              <DiseaseDetailView />
            </ProtectedRoute>
          } />

          <Route path="/recognize" element={
            <ProtectedRoute>
              <PlantRecognition />
            </ProtectedRoute>
          } />

          <Route path="/plantDetails" element={
            <ProtectedRoute>
              <PlantDetails />
            </ProtectedRoute>
          } />

          <Route path="/plant/:plantId" element={
            <ProtectedRoute>
              <PlantDetailViewPage />
            </ProtectedRoute>
          } />

          <Route path="/learning-materials" element={
            <ProtectedRoute>
              <ViewLearningMaterial />
            </ProtectedRoute>
          } />

          <Route path="/learning-materials/:id" element={
            <ProtectedRoute>
              <ViewDetailsLearningMaterial />
            </ProtectedRoute>
          } />
          
          {/* ========== ADMIN ONLY ROUTES ========== */}
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminManagement />
            </AdminRoute>
          } />

          <Route path="/admin/overview" element={
            <AdminRoute>
              <AdminOverview />
            </AdminRoute>
          } />

          <Route path="/admin/quizManagement" element={
            <AdminRoute>
              <QuizManagement />
            </AdminRoute>
          } />

          <Route path="/admin/quiz/create" element={
            <AdminRoute>
              <CreateQuiz />
            </AdminRoute>
          } />

          <Route path="/admin/quiz/:id" element={
            <AdminRoute>
              <ViewQuiz />
            </AdminRoute>
          } />

          <Route path="/admin/quiz/:id/edit" element={
            <AdminRoute>
              <EditQuiz />
            </AdminRoute>
          } />

          <Route path="/admin/materials" element={
            <AdminRoute>
              <LearningMaterial />
            </AdminRoute>
          } />

          <Route path="/admin/materials/create" element={
            <AdminRoute>
              <CreateMaterial />
            </AdminRoute>
          } />

          <Route path="/admin/materials/:id" element={
            <AdminRoute>
              <ViewMaterial />
            </AdminRoute>
          } />

          <Route path="/admin/materials/:id/edit" element={
            <AdminRoute>
              <EditMaterial />
            </AdminRoute>
          } />

          <Route path="/admin/analysis" element={
            <AdminRoute>
              <AdminAnalytics />
            </AdminRoute>
          } />
          

        </Routes>



      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;