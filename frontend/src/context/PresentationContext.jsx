import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PresentationContext = createContext();

export const usePresentation = () => useContext(PresentationContext);

export const PresentationProvider = ({ children }) => {
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const demoSequence = [
    { path: '/admin/dashboard', duration: 4000, name: 'National Dashboard' },
    { path: '/admin/maps', duration: 4000, name: 'Risk Map' },
    { path: '/admin/villages', duration: 2000, name: 'Villages List' },
    { path: '/admin/outbreak-simulator', duration: 5000, name: 'AI Prediction Simulator' },
    { path: '/admin/alerts', duration: 4000, name: 'Alert Generation' },
    { path: '/admin/war-room', duration: 6000, name: 'National Command Center' },
  ];

  const startDemo = () => {
    setIsDemoActive(true);
    setCurrentStep(0);
    navigate(demoSequence[0].path);
  };

  const stopDemo = () => {
    setIsDemoActive(false);
    setCurrentStep(0);
  };

  useEffect(() => {
    if (!isDemoActive) return;

    const step = demoSequence[currentStep];
    const timer = setTimeout(() => {
      const nextStep = currentStep + 1;
      if (nextStep < demoSequence.length) {
        setCurrentStep(nextStep);
        navigate(demoSequence[nextStep].path);
      } else {
        stopDemo(); // Stop when finished
      }
    }, step.duration);

    return () => clearTimeout(timer);
  }, [isDemoActive, currentStep, navigate]);

  return (
    <PresentationContext.Provider value={{ isDemoActive, startDemo, stopDemo, currentStep, demoSequence }}>
      {children}
    </PresentationContext.Provider>
  );
};
