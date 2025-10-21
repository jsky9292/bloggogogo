import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import CoursePage from './components/CoursePage';
import CourseDetailPage from './components/CourseDetailPage';

const AppRouter: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/courses" element={<CoursePage />} />
            <Route path="/course/:courseId" element={<CourseDetailPage />} />
        </Routes>
    );
};

export default AppRouter;
