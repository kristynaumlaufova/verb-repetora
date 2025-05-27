import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { authService } from "./services/authService";
import LeftSideBar from "./components/LeftSideBar/LeftSideBar";
import TopBar from "./components/TopBar/TopBar";
import MainContent from "./components/MainContent/MainContent";
import ManageLanguages from "./components/ManageLanguages/ManageLanguages";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import "./App.css";

const AppContent: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState("ENGLISH");
  const [isAuthenticated, setIsAuthenticated] = useState(
    authService.isAuthenticated()
  );
  const navigate = useNavigate();

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

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
          userName={authService.getUser()?.username || ""}
          userEmail=""
          onCreateNewLanguage={handleCreateNewLanguage}
        />
        <Routes>
          <Route path="/manage-languages" element={<ManageLanguages />} />
          <Route
            path="/lessons"
            element={<MainContent currentPage="lessons" />}
          />
          <Route
            path="/vocabulary"
            element={<MainContent currentPage="vocabulary" />}
          />
          <Route path="/" element={<MainContent currentPage="dashboard" />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </Router>
  );
}

export default App;
