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

      const response = await axios.get(`${API_BASE_URL}/api/enrollments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
    } catch (error) {
      console.error('Error fetching formations:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
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
