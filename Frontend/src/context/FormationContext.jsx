import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const FormationContext = createContext();

export const FormationProvider = ({ children }) => {
  const [formations, setFormations] = useState([]);
  const [currentPage, setCurrentPage] = useState('overview');

  const updateFormations = async (studentId) => {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token || !studentId) {
        console.log('Missing token or studentId');
        return;
      }

      console.log('Fetching enrollments for student:', studentId);

      // Use a timeout to avoid hanging on network errors
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await axios.get(`${API_BASE_URL}/api/enrollments`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError' || error.code === 'ERR_NETWORK') {
            console.warn('Connection to server failed, using mock data');
            // Return mock data when server is unavailable
            return {
              data: {
                success: true,
                data: [
                  {
                    _id: 'mock-formation-1',
                    itemType: 'formation',
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
                    itemType: 'formation',
                    progress: 100,
                    status: 'completed',
                    formation: {
                      _id: 'mock-formation-2',
                      title: 'Introduction à React',
                      description: 'Les bases de React et son écosystème (Mode hors ligne)',
                      coverImage: null
                    }
                  }
                ]
              }
            };
          }
          throw error;
        });

        clearTimeout(timeoutId);
        console.log('Enrollments response:', response.data);

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
        }
      } catch (innerError) {
        clearTimeout(timeoutId);
        throw innerError;
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
