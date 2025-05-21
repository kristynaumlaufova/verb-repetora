import React from "react";
import styles from "./Logo.module.css";

const Logo: React.FC = () => {
  return (
    <div className={styles.logo}>
      <span className={styles.text}>VerbRepetora</span>
    </div>
  );
};

export default Logo;
