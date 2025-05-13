import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { initializeNewTeacher } from '../../services/teacherInitializer';
import TeacherAnalytics from '../../components/TeacherAnalytics';
import TeacherMessages from '../../components/TeacherMessages';
import { API_BASE_URL } from '../../config/api';

export const DashboardTeacher = () => {
  const [teacherData, setTeacherData] = useState(initializeNewTeacher);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/api/users/teacher-dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
          setTeacherData(response.data.data || initializeNewTeacher);
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setTeacherData(initializeNewTeacher);
      }
    };

    fetchTeacherData();
  }, []);

  return (
    <div>
      <TeacherAnalytics data={teacherData.analytics} />
      <TeacherMessages messages={teacherData.messages} />
    </div>
  );
};