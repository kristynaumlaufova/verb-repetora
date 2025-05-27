import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import styles from "./ProfileMenu.module.css";
import useClickOutside from "../../../hooks/useClickOutside";

interface ProfileMenuProps {
  userName: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ userName }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  useClickOutside(profileMenuRef, () => setIsProfileMenuOpen(false));

  const handleProfileClick = useCallback(
    () => setIsProfileMenuOpen((prev) => !prev),
    []
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }, [logout, navigate]);

  return (
    <div className={styles.userProfile} ref={profileMenuRef}>
      <button className={styles.avatar} onClick={handleProfileClick}>
        {userName.charAt(0).toUpperCase()}
      </button>
      {isProfileMenuOpen && (
        <div className={`${styles.dropdown} ${styles.profileDropdown}`}>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
          </div>
          <button className={styles.dropdownItem} onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
