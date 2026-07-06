import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ShowcaseFeedback from '@/pages/ShowcaseFeedback';
import SkillTracker from '@/pages/SkillTracker';
import TraineeRoster from '@/pages/TraineeRoster';
import CharacterBuilder from '@/pages/CharacterBuilder';
import CharacterReview from '@/pages/CharacterReview';
import Onboarding from '@/pages/Onboarding';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import Assignments from '@/pages/Assignments';
import StrengthConditioning from '@/pages/StrengthConditioning';
import PerformanceLab from '@/pages/PerformanceLab';
import WeeklyProgramming from '@/pages/WeeklyProgramming';
import WrestlingConditioning from '@/pages/WrestlingConditioning';
import RecoveryCenter from '@/pages/RecoveryCenter';
import NutritionCenter from '@/pages/NutritionCenter';
import PerformanceAnalytics from '@/pages/PerformanceAnalytics';
import GamificationCenter from '@/pages/GamificationCenter';
import DuesManagement from '@/pages/DuesManagement';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout
  ? <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0a0a0a" }}>
    <div className="flex flex-col items-center gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #8b3dff 0%, #dc2626 100%)", opacity: 0.9 }} />
        <div className="absolute inset-[3px] rounded-[14px] flex items-center justify-center"
          style={{ background: "#0a0a0a" }}>
          <span className="text-xl font-black"
            style={{ background: "linear-gradient(135deg, #8b3dff, #dc2626)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            PCW
          </span>
        </div>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full"
            style={{
              background: "#8b3dff",
              animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/ShowcaseFeedback"
        element={
          <LayoutWrapper currentPageName="ShowcaseFeedback">
            <ShowcaseFeedback />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Onboarding"
        element={<Onboarding />}
      />
      <Route
        path="/CharacterReview"
        element={
          <LayoutWrapper currentPageName="CharacterReview">
            <CharacterReview />
          </LayoutWrapper>
        }
      />
      <Route
        path="/CharacterBuilder"
        element={
          <LayoutWrapper currentPageName="CharacterBuilder">
            <CharacterBuilder />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SkillTracker"
        element={
          <LayoutWrapper currentPageName="SkillTracker">
            <SkillTracker />
          </LayoutWrapper>
        }
      />
      <Route
        path="/TraineeRoster"
        element={
          <LayoutWrapper currentPageName="TraineeRoster">
            <TraineeRoster />
          </LayoutWrapper>
        }
      />
      <Route
        path="/Assignments"
        element={
          <LayoutWrapper currentPageName="Assignments">
            <Assignments />
          </LayoutWrapper>
        }
      />
      <Route
        path="/ExerciseLibrary"
        element={
          <LayoutWrapper currentPageName="ExerciseLibrary">
            <ExerciseLibrary />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StrengthConditioning"
        element={
          <LayoutWrapper currentPageName="StrengthConditioning">
            <StrengthConditioning />
          </LayoutWrapper>
        }
      />
      <Route
        path="/PerformanceLab"
        element={
          <LayoutWrapper currentPageName="PerformanceLab">
            <PerformanceLab />
          </LayoutWrapper>
        }
      />
      <Route
        path="/WeeklyProgramming"
        element={
          <LayoutWrapper currentPageName="WeeklyProgramming">
            <WeeklyProgramming />
          </LayoutWrapper>
        }
      />
      <Route
        path="/WrestlingConditioning"
        element={
          <LayoutWrapper currentPageName="WrestlingConditioning">
            <WrestlingConditioning />
          </LayoutWrapper>
        }
      />
      <Route
        path="/RecoveryCenter"
        element={
          <LayoutWrapper currentPageName="RecoveryCenter">
            <RecoveryCenter />
          </LayoutWrapper>
        }
      />
      <Route
        path="/NutritionCenter"
        element={
          <LayoutWrapper currentPageName="NutritionCenter">
            <NutritionCenter />
          </LayoutWrapper>
        }
      />
      <Route
        path="/PerformanceAnalytics"
        element={
          <LayoutWrapper currentPageName="PerformanceAnalytics">
            <PerformanceAnalytics />
          </LayoutWrapper>
        }
      />
      <Route
        path="/GamificationCenter"
        element={
          <LayoutWrapper currentPageName="GamificationCenter">
            <GamificationCenter />
          </LayoutWrapper>
        }
      />
      <Route
        path="/DuesManagement"
        element={
          <LayoutWrapper currentPageName="DuesManagement">
            <DuesManagement />
          </LayoutWrapper>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
          <Toaster />
          <VisualEditAgent />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App