import React from "react";
import { useNavigate } from "react-router-dom";
import AdminPanel from "../../components/AdminPanel";

const CreateEvent = ({ onBack }) => {
  const navigate = useNavigate();

  // Fallback handler jika onBack tidak diberikan dari parent
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/admin");
    }
  };

  const onSaveConfig = () => {
    // After successful create, navigate back to list
    navigate("/admin");
  };

  return (
    <AdminPanel
      onSaveConfig={onSaveConfig}
      onBack={handleBack}
    />
  );
};

export default CreateEvent;
