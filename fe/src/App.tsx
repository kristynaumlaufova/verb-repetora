import React, { useState } from "react";
import LeftSideBar from "./components/LeftSideBar/LeftSideBar";
import TopBar from "./components/TopBar/TopBar";
import MainContent from "./components/MainContent/MainContent";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentLanguage, setCurrentLanguage] = useState("ENGLISH");

  const handleNavigate = (menuId: string) => {
    setCurrentPage(menuId);
  };

  return (
    <div className="App">
      <LeftSideBar onNavigate={handleNavigate} />
      <div className="main-container">
        <TopBar
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
          userName="John Doue"
          userEmail="jdoe@acme.com"
        />
        <MainContent currentPage={currentPage} />
      </div>
    </div>
  );
}

export default App;
