import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, api } from '../config/api';

const FormationContext = createContext();

export const FormationProvider = ({ children }) => {
  const [formations, setFormations] = useState([]);
  const [currentPage, setCurrentPage] = useState('overview');
  const controllerRef = useRef(null);
  const timeoutIdRef = useRef(null);

  // Cleanup function for AbortController when component unmounts
  useEffect(() => {
    return () => {
      // Abort any pending requests when component unmounts
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      // Clear any pending timeouts
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const updateFormations = async (studentId) => {
    try {
      if (!studentId) {
        console.log('Missing studentId');
        return;
      }

      console.log('Fetching enrollments for student:', studentId);

      // Use our custom api instance which handles cancellations and errors
      const response = await api.get('/api/enrollments');

      console.log('Enrollments response:', response.data);

      // Check if we got mock data due to cancellation or network error
      if (response.data.isMockData) {
        console.log('Using mock data:', response.data.message);
        const mockFormations = [
          {
            _id: 'mock-formation-1',
            title: 'Formation JavaScript Avancé',
            description: 'Apprenez les concepts avancés de JavaScript (Mode hors ligne)',
            progress: 30,
            status: 'in_progress',
            formation: {
              _id: 'mock-formation-1',
              title: 'Formation JavaScript Avancé',
              description: 'Apprenez les concepts avancés de JavaScript (Mode hors ligne)',
              coverImage: null
            }
          },
          {
            _id: 'mock-formation-2',
            title: 'Introduction à React',
            description: 'Les bases de React et son écosystème (Mode hors ligne)',
            progress: 100,
            status: 'completed',
            formation: {
              _id: 'mock-formation-2',
              title: 'Introduction à React',
              description: 'Les bases de React et son écosystème (Mode hors ligne)',
              coverImage: null
            }
          }
        ];
        setFormations(mockFormations);
        return;
      }

      if (response.data.success) {
        // Filter only formation enrollments
        const formationEnrollments = response.data.data.filter(
          enrollment => enrollment.itemType === 'formation' && enrollment.formation
        );

        console.log('Formation enrollments:', formationEnrollments);

        // Extract formation data
        const formationsData = formationEnrollments.map(enrollment => ({
          _id: enrollment._id,
          title: enrollment.formation.title,
          description: enrollment.formation.description,
          progress: enrollment.progress || 0,
          status: enrollment.status,
          formation: enrollment.formation
        }));

        console.log('Formatted formations data:', formationsData);

        setFormations(formationsData);
      } else {
        console.error('Failed to fetch formations:', response.data.message);
        // Set mock data in case of error
        const mockFormations = [
          {
            _id: 'mock-error-formation-1',
            title: 'Formation Web Development',
            description: 'Apprenez le développement web moderne (Mode hors ligne)',
            progress: 45,
            status: 'in_progress',
            formation: {
              _id: 'mock-error-formation-1',
              title: 'Formation Web Development',
              description: 'Apprenez le développement web moderne (Mode hors ligne)',
              coverImage: null
            }
          }
        ];
        setFormations(mockFormations);
      }
    } catch (error) {
      console.error('Error fetching formations:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }

      // Set mock data in case of error
      const mockFormations = [
        {
          _id: 'mock-error-formation-1',
          title: 'Formation Web Development',
          description: 'Apprenez le développement web moderne (Mode hors ligne)',
          progress: 45,
          status: 'in_progress',
          formation: {
            _id: 'mock-error-formation-1',
            title: 'Formation Web Development',
            description: 'Apprenez le développement web moderne (Mode hors ligne)',
            coverImage: null
          }
        }
      ];

      setFormations(mockFormations);
    }
  };

  const navigateToPage = (pageName) => {
    setCurrentPage(pageName);
  };

  return (
    <FormationContext.Provider value={{
      formations,
      updateFormations,
      currentPage,
      navigateToPage
    }}>
      {children}
    </FormationContext.Provider>
  );
};

export const useFormation = () => useContext(FormationContext);
