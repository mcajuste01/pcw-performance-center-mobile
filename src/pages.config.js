/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import CheckIn from './pages/CheckIn';
import CoachDashboard from './pages/CoachDashboard';
import CoachFeedback from './pages/CoachFeedback';
import Community from './pages/Community';
import CreateAssignment from './pages/CreateAssignment';
import Culture from './pages/Culture';
import Curriculum from './pages/Curriculum';
import Dashboard from './pages/Dashboard';
import DirectMessages from './pages/DirectMessages';
import Events from './pages/Events';
import FitbitCallback from './pages/FitbitCallback';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MyTasks from './pages/MyTasks';
import Notebook from './pages/Notebook';
import NotificationSettings from './pages/NotificationSettings';
import Payments from './pages/Payments';
import Profile from './pages/Profile';
import ResourceCenter from './pages/ResourceCenter';
import RoleManagement from './pages/RoleManagement';
import SkillTracking from './pages/SkillTracking';
import TierManagement from './pages/TierManagement';
import UserDetail from './pages/UserDetail';
import VideoAnalysis from './pages/VideoAnalysis';
import Workouts from './pages/Workouts';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Analytics": Analytics,
    "Chat": Chat,
    "CheckIn": CheckIn,
    "CoachDashboard": CoachDashboard,
    "CoachFeedback": CoachFeedback,
    "Community": Community,
    "CreateAssignment": CreateAssignment,
    "Culture": Culture,
    "Curriculum": Curriculum,
    "Dashboard": Dashboard,
    "DirectMessages": DirectMessages,
    "Events": Events,
    "FitbitCallback": FitbitCallback,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MyTasks": MyTasks,
    "Notebook": Notebook,
    "NotificationSettings": NotificationSettings,
    "Payments": Payments,
    "Profile": Profile,
    "ResourceCenter": ResourceCenter,
    "RoleManagement": RoleManagement,
    "SkillTracking": SkillTracking,
    "TierManagement": TierManagement,
    "UserDetail": UserDetail,
    "VideoAnalysis": VideoAnalysis,
    "Workouts": Workouts,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};