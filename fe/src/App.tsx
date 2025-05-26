import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
import LeftSideBar from "./components/LeftSideBar/LeftSideBar";
import TopBar from "./components/TopBar/TopBar";
import MainContent from "./components/MainContent/MainContent";
import ManageLanguages from "./components/ManageLanguages/ManageLanguages";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import "./App.css";

const AppContent: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState("ENGLISH");
  const navigate = useNavigate();
  const isAuthenticated = false; // TODO: Replace with actual auth state

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
          userName="John Doue"
          userEmail="jdoe@acme.com"
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
