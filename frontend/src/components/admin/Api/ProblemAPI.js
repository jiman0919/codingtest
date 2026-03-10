// src/components/admin/Api/ProblemAPI.js
import api from '../../../services/api';

/**
 * 특정 강의의 문제 목록을 조회하는 API 호출 함수
 * GET /problems/courses/{course_id}/problems
 * @param {string | number} classId - 조회할 강의의 ID
 * @returns {Promise<object[]>} - 문제 목록 배열
 */
export const getProblemList = async (classId) => {
    try {
        // ✅ 수정된 부분: API_BASE_URL 없이 상대 경로 사용
        const response = await api.get(`/problems/courses/${classId}/problems/list`);
        return response.data;
    } catch (error) {
        console.error("문제 목록 로딩 실패:", error);
        const errorMessage = error.response?.data?.detail || '문제 목록을 불러오는 데 실패했습니다.';
        throw new Error(errorMessage);
    }
};

/**
 * 새로운 문제를 추가하는 API 호출 함수
 * POST /problems
 * @param {object} problemData - 추가할 문제 데이터
 * @returns {Promise<object>} - 생성된 문제 정보
 */
export const addProblem = async (problemData) => {
    try {
        // ✅ 수정된 부분: API_BASE_URL 없이 상대 경로 사용
        const response = await api.post(`/problems/`, problemData);
        return response.data;
    } catch (error) {
        console.error("문제 추가 실패:", error);
        const errorMessage = error.response?.data?.detail || '문제 추가에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

/**
 * 특정 문제의 상세 정보를 조회하는 API 호출 함수
 * GET /problems/{problem_id}
 * @param {string | number} problemId - 조회할 문제의 ID
 * @returns {Promise<object>} - 문제 상세 정보
 */
export const getProblemDetail = async (problemId) => {
    try {
        // ✅ 수정된 부분: API_BASE_URL 없이 상대 경로 사용
        const response = await api.get(`/problems/${problemId}`);
        return response.data;
    } catch (error) {
        console.error(`문제 ID ${problemId} 상세 정보 로딩 실패:`, error);
        const errorMessage = error.response?.data?.detail || '문제 상세 정보를 불러오는 데 실패했습니다.';
        throw new Error(errorMessage);
    }
};

/**
 * 특정 문제를 수정하는 API 호출 함수
 * PUT /problems/{problem_id}
 * @param {string | number} problemId - 수정할 문제의 ID
 * @param {object} updatedData - 수정된 문제 데이터
 * @returns {Promise<object>} - 수정된 문제 정보
 */
export const updateProblem = async (problemId, updatedData) => {
    try {
        // ✅ 수정된 부분: API_BASE_URL 없이 상대 경로 사용
        const response = await api.put(`/problems/${problemId}`, updatedData);
        return response.data;
    } catch (error) {
        console.error(`문제 ID ${problemId} 업데이트 실패:`, error);
        const errorMessage = error.response?.data?.detail || '문제 업데이트에 실패했습니다.';
        throw new Error(errorMessage);
    }
};

/**
 * 특정 문제를 삭제하는 API 호출 함수
 * DELETE /problems/{problem_id}
 * @param {string | number} problemId - 삭제할 문제의 ID
 * @returns {Promise<void>}
 */
export const deleteProblem = async (problemId) => {
    try {
        // ✅ 수정된 부분: API_BASE_URL 없이 상대 경로 사용
        await api.delete(`/problems/${problemId}`);
        console.log(`문제 삭제 성공: problemId=${problemId}`);
    } catch (error) {
        console.error(`문제 ID ${problemId} 삭제 실패:`, error);
        const errorMessage = error.response?.data?.detail || '문제 삭제에 실패했습니다.';
        throw new Error(errorMessage);
    }
};