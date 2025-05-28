import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import LeftSideBar from "./components/LeftSideBar/LeftSideBar";
import TopBar from "./components/TopBar/TopBar";
import Dashboard from "./components/Pages/Dashboard";
import Lessons from "./components/Pages/Lessons";
import Vocabulary from "./components/Pages/Vocabulary";
import ManageLanguages from "./components/ManageLanguages/ManageLanguages";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import "./App.css";

const AppContent: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState("ENGLISH");
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleCreateNewLanguage = () => {
    navigate("/manage-languages");
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <LeftSideBar />
      <div className="main-container">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          userName={user?.username || ""}
          onCreateNewLanguage={handleCreateNewLanguage}
        />        <Routes>
          <Route path="/manage-languages" element={<ManageLanguages />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/*"
            element={
              <LanguageProvider>
                <AppContent />
              </LanguageProvider>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
