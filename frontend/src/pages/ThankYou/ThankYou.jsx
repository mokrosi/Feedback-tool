import React from "react";
import { useNavigate } from "react-router-dom";
import "./ThankYou.css"; // new CSS file

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <div className="thankyou-container">
      <div className="left-panel">
        <div className="left-content">
          <h1>FeedbackPro</h1>
          <h2>Thank You for Your Feedback!</h2>
          <p>
            Your voice helps us create better surveys, deeper insights, and smarter decisions.
          </p>
          <div className="info-boxes">
            <div>Your response has been saved successfully!</div>
            <div>Insights will be available in your dashboard</div>
            <div>Thank you for being part of our community!</div>
          </div>
        </div>
      </div>

      <div className="right-panel">
        <div className="right-content">
          <h1>Your response has been recorded!</h1>
          <p>
            We appreciate your time and effort. You may now return to your dashboard or explore more surveys.
          </p>
          <button onClick={() => navigate("/")}>Go to Dashboard</button>
        </div>
      </div>
    </div>
  );
}
