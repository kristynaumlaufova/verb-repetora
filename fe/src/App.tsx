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
import Languages from "./components/Pages/Languages/Languages";
import WordTypes from "./components/Pages/WordTypes/WordTypes";
import Lessons from "./components/Pages/Lessons/Lessons";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import "./App.css";
import Vocabulary from "./components/Pages/Vocabulary/Vocabulary";
import Review from "./components/Pages/Review/Review";

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="App">
      <LeftSideBar />
      <div className="main-container">
        <TopBar userName={user?.username || ""} />{" "}
        <Routes>
          <Route path="/manage-languages" element={<Languages />} />
          <Route path="/word-types" element={<WordTypes />} />
          <Route path="/vocabulary" element={<Vocabulary />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/review" element={<Review />} />
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
