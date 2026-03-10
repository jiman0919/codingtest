// src/components/MasterAdmin/ManageAPI.js

import api from '../../services/api'; 

/**
 * 모든 교수 목록을 가져오는 API 함수
 */
export const getAllProfessors = async () => {
    try {
        const response = await api.get('/admin/professors');
        return response.data;
    } catch (error) {
        console.error("교수 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

/**
 * 모든 학생 목록을 가져오는 API 함수
 */
export const getAllStudents = async () => {
    try {
        const response = await api.get('/admin/students');
        return response.data;
    } catch (error) {
        console.error("학생 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

/**
 * 새로운 교수 계정을 추가하는 API 함수
 */
export const createAdminUser = async (userData) => {
    try {
        const response = await api.post('/admin/professors', userData);
        return response.data;
    } catch (error) {
        console.error("관리자 계정 생성 중 오류 발생:", error);
        throw error;
    }
};

/**
 * ✨ [수정] 특정 교수 계정을 삭제하는 API 함수
 * @param {string} username - 삭제할 교수의 username
 */
export const deleteProfessor = async (username) => {
    try {
        const response = await api.delete(`/admin/professors/${username}`);
        return response.data;
    } catch (error) {
        console.error(`교수 ${username} 삭제 중 오류 발생:`, error);
        throw error;
    }
};

/**
 * ✨ [추가] 특정 학생 계정을 삭제하는 API 함수
 * @param {string} username - 삭제할 학생의 username
 */
export const deleteStudent = async (username) => {
    try {
        const response = await api.delete(`/admin/students/${username}`);
        return response.data;
    } catch (error) {
        console.error(`학생 ${username} 삭제 중 오류 발생:`, error);
        throw error;
    }
};

/**
 * 특정 교수의 비밀번호를 초기화하는 API 함수
 * @param {string} username - 비밀번호를 초기화할 교수의 username
 */
export const resetProfessorPassword = async (username) => {
    try {
        const response = await api.post(`/admin/professors/${username}/reset-password`);
        return response.data;
    } catch (error) {
        console.error(`교수 ${username}의 비밀번호 초기화 중 오류 발생:`, error);
        throw error;
    }
};