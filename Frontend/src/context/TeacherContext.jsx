import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const TeacherContext = createContext();

export const TeacherProvider = ({ children }) => {
  const [teacherData, setTeacherData] = useState({
    fullName: '',
    profileImage: localStorage.getItem('teacherProfileImage') || '',
    rating: 0,
    role: 'teacher',
    phone: '',
    bio: '',
    email: '',
    profileCompletionPercentage: parseInt(localStorage.getItem('profileCompletionPercentage') || '0')
  });

  // Calculate profile completion percentage
  const calculateProfileCompletion = (data) => {
    const fields = [
      { name: 'fullName', weight: 20 },
      { name: 'profileImage', weight: 20 },
      { name: 'phone', weight: 20 },
      { name: 'bio', weight: 20 },
      { name: 'email', weight: 20 }
    ];

    let completionPercentage = 0;

    fields.forEach(field => {
      if (data[field.name] && data[field.name].toString().trim() !== '') {
        completionPercentage += field.weight;
      }
    });

    return completionPercentage;
  };

  // Fetch teacher data on component mount and when token changes
  useEffect(() => {
    const fetchTeacherData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        return;  // Don't fetch if no token
      }

      // Check if user is a teacher before making the request
      const userRole = localStorage.getItem('userRole');
      if (userRole !== 'teacher') {
        console.log('User is not a teacher, skipping teacher profile fetch');
        return;
      }

      try {
        console.log('Fetching teacher profile data...');
        const response = await axios.get(`${API_BASE_URL}/api/users/teacher-profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const updatedData = {
            ...response.data.data
          };

          // Calculate profile completion
          const completionPercentage = calculateProfileCompletion(updatedData);
          updatedData.profileCompletionPercentage = completionPercentage;

          // Store the completion percentage in localStorage
          localStorage.setItem('profileCompletionPercentage', completionPercentage.toString());

          // Ensure consistent image URL format
          if (response.data.data.profileImage) {
            // Store just the path, not the full URL
            const imagePath = response.data.data.profileImage;
            localStorage.setItem('teacherProfileImage', imagePath);
            updatedData.profileImage = imagePath;
            console.log('Profile image updated:', imagePath);
          }

          setTeacherData(prev => ({
            ...prev,
            ...updatedData
          }));

          console.log('Teacher data updated:', updatedData);
        }
      } catch (error) {
        // Only log error if it's not a 403 (forbidden) error for non-teachers
        if (error.response?.status !== 403) {
          console.error('Error fetching teacher data:', error);
        }

        if (error.response?.status === 401) {
          localStorage.removeItem('token');
        }
      }
    };

    fetchTeacherData();

    // Also fetch data when the component mounts
    const intervalId = setInterval(fetchTeacherData, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  const updateTeacherData = (data) => {
    setTeacherData(prev => {
      const newData = { ...prev, ...data };

      // Store just the path for profile image, not the full URL
      if (data.profileImage) {
        localStorage.setItem('teacherProfileImage', data.profileImage);
        console.log('Profile image updated in updateTeacherData:', data.profileImage);
      }

      // Recalculate profile completion percentage
      const completionPercentage = calculateProfileCompletion(newData);
      newData.profileCompletionPercentage = completionPercentage;

      // Store the completion percentage in localStorage
      localStorage.setItem('profileCompletionPercentage', completionPercentage.toString());
      console.log('Profile completion updated:', completionPercentage);

      return newData;
    });

    // Force a refresh of the teacher data from the server after updating
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/api/users/teacher-profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          const updatedData = { ...response.data.data };
          const completionPercentage = calculateProfileCompletion(updatedData);
          updatedData.profileCompletionPercentage = completionPercentage;

          setTeacherData(prev => ({
            ...prev,
            ...updatedData
          }));
        }
      } catch (error) {
        console.error('Error refreshing teacher data:', error);
      }
    }, 1000); // Wait 1 second before refreshing
  };

  return (
    <TeacherContext.Provider value={{ teacherData, updateTeacherData }}>
      {children}
    </TeacherContext.Provider>
  );
};

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
};
