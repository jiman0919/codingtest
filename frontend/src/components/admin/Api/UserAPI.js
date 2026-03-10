// src/admin/Api/UserAPI.js

import api from '../../../services/api';

/**
 * 특정 강좌의 모든 수강 신청(enrollments) 목록을 가져옵니다.
 * @param {number} classId - 강좌의 ID
 */
export const getEnrollmentsForCourse = async (classId) => {
    try {
        console.log(`Fetching enrollments for course ${classId}...`);
        const response = await api.get(`/courses/${classId}/enrollments`);
        console.log(`Enrollments for course ${classId} fetched:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching enrollments for course ${classId}:`, error);
        throw error;
    }
};

/**
 * 특정 수강 신청을 승인합니다.
 * @param {number} classId - 강좌의 ID
 * @param {number} enrollmentId - 수강 신청의 ID
 */
export const approveEnrollment = async (classId, enrollmentId) => {
    try {
        console.log(`Approving enrollment ${enrollmentId} for course ${classId}...`);
        const response = await api.put(`/courses/${classId}/enrollments/${enrollmentId}/approve`);
        console.log(`Enrollment ${enrollmentId} approved:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error approving enrollment ${enrollmentId}:`, error);
        throw error;
    }
};

/**
 * 특정 수강 신청을 거절합니다.
 * @param {number} classId - 강좌의 ID
 * @param {number} enrollmentId - 수강 신청의 ID
 */
export const rejectEnrollment = async (classId, enrollmentId) => {
    try {
        console.log(`Rejecting enrollment ${enrollmentId} for course ${classId}...`);
        const response = await api.put(`/courses/${classId}/enrollments/${enrollmentId}/reject`);
        console.log(`Enrollment ${enrollmentId} rejected:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error rejecting enrollment ${enrollmentId}:`, error);
        throw error;
    }
};

/**
 * ✨ [추가] 특정 학생의 비밀번호를 초기화합니다.
 * @param {number} studentId - 학생의 ID
 */
export const resetStudentPassword = async (studentId) => {
    try {
        console.log(`Resetting password for student ${studentId}...`);
        const response = await api.post(`/professor/reset-password/${studentId}`);
        console.log(`Password for student ${studentId} has been reset:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error resetting password for student ${studentId}:`, error);
        throw error;
    }
};


// --- 기존의 UserAPI.js 함수들은 유지됩니다. ---

export const getUserList = async (classId) => {
    console.warn("UserAPI: getUserList 함수는 현재 데이터 소스가 연결되지 않았습니다. 빈 배열을 반환합니다. 실제 API 또는 명시된 하드코딩 데이터 소스 연동이 필요합니다.");
    return [];
};

export const getUserDetail = async (userId) => {
    console.warn("UserAPI: getUserDetail 함수는 현재 데이터 소스가 연결되지 않았습니다. null을 반환합니다. 실제 API 또는 명시된 하드코딩 데이터 소스 연동이 필요합니다.");
    return null;
};

export const addUser = async (newUser) => {
    console.error("UserAPI: addUser 함수는 구현되지 않았습니다. 실제 API 연동이 필요합니다.");
    throw new Error("Add user functionality not implemented.");
};

export const updateUser = async (userId, updatedUser) => {
    console.error("UserAPI: updateUser 함수는 구현되지 않았습니다. 실제 API 연동이 필요합니다.");
    throw new Error("Update user functionality not implemented.");
};

export const deleteUser = async (userId) => {
    console.error("UserAPI: deleteUser 함수는 구현되지 않았습니다. 실제 API 연동이 필요합니다.");
    throw new Error("Delete user functionality not implemented.");
};