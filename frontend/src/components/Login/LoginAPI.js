// src/components/Login/LoginAPI.js
import api from '../../services/api';
// axios를 직접 사용하지 않고 api 인스턴스를 통일해서 사용합니다.
// import axios from 'axios';

// 백엔드 API의 기본 URL
const API_BASE_URL = 'http://localhost:8000'; 

/**
 * 사용자 로그인을 처리하는 API 호출 함수
 * @param {string} username - 사용자의 아이디
 * @param {string} password - 사용자의 비밀번호
 * @returns {Promise<object>} - 로그인 성공 시 토큰 정보 등을 포함한 응답 객체
 */
export const loginUser = async (username, password) => {
    try {
        const response = await api.post(`${API_BASE_URL}/auth/login`, {
            username: username,
            password: password
        });

        const { access_token, refresh_token} = response.data;
        
        if (access_token && refresh_token) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            // ✨ 수정된 부분: 이름이 있을 경우 localStorage에 저장합니다.
            if (username) {
                localStorage.setItem('user_name', username);
            }
        }

        return response.data;
    } catch (error) {
        console.error('로그인 API 호출 중 오류 발생:', error);
        throw error;
    }
};

/**
 * 사용자 회원가입을 처리하는 API 호출 함수
 * @param {string} name - 사용자의 이름
 * @param {string} username - 사용자의 아이디
 * @param {string} password - 사용자의 비밀번호
 * @param {string} confirmPassword - 비밀번호 확인 값
 * @returns {Promise<object>} - 회원가입 성공 시 응답 객체
 */
export const registerUser = async (name, username, password, confirmPassword, role = "student") => {
    try {
        const response = await api.post(`${API_BASE_URL}/auth/register`, {
            name: name,
            username: username,
            password: password,
            confirm_password: confirmPassword,
            role: role
        });

        return response.data;
    } catch (error) {
        console.error('회원가입 API 호출 중 오류 발생:', error);
        throw error;
    }
};

/**
 * 사용자 로그아웃을 처리하는 API 호출 함수
 */
export const logoutUser = async () => {
    // ✨ 수정된 부분: API 호출 성공/실패와 관계없이 클라이언트에서 먼저 토큰과 이름을 삭제합니다.
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_name');
    console.log("Tokens and user name removed from local storage.");

    try {
        console.log("Logging out, sending request to backend...");
        await api.post(`${API_BASE_URL}/auth/logout`);
        console.log("Backend logout successful.");
    } catch (error) {
        console.error('로그아웃 API 호출 실패:', error);
    }
};
/*
*사용자 비밀번호 변경을 처리하는 API 호출 함수
*/
export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
        const response = await api.patch(`${API_BASE_URL}/auth/change-password`, {
            current_password: currentPassword,
            new_password: newPassword,
            confirm_new_password: confirmPassword
        });
        return response.data;
    } catch (error) {
        console.error('비밀번호 변경 API 호출 중 오류 발생:', error);
        throw error;
    }
};