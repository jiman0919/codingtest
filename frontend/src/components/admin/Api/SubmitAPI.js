// src/admin/Api/SubmitAPI.js

import api from '../../../services/api';

/**
 * 강좌의 모든 학생 목록을 가져옵니다.
 */
export const getSubmitUserList = async (classId) => {
    console.log(`[SubmitAPI] Fetching submitted user list (classId: ${classId}) from backend.`);
    try {
        const response = await api.get(`/courses/${classId}/students/scores`);
        console.log("[SubmitAPI] Fetched users from backend:", response.data);
        return response.data;
    } catch (error) {
        console.error("[SubmitAPI] Error fetching users from backend:", error.response ? error.response.data : error.message);
        throw error;
    }
};

/**
 * 특정 학생의 강좌 내 모든 문제에 대한 제출 현황 목록을 가져옵니다.
 */
export const getSubmitProblemList = async (classId, userId) => {
    console.log(`[SubmitAPI] Fetching submitted problem list for userId: ${userId} (classId: ${classId}) from backend.`);
    try {
        if (!userId) {
            console.warn("[SubmitAPI] Missing userId for fetching submit problem list. Returning empty array.");
            return [];
        }
        const response = await api.get(`/courses/${classId}/students/${userId}/problems`);
        console.log(`[SubmitAPI] Fetched submitted problems for userId ${userId}:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[SubmitAPI] Error fetching submitted problem list for userId ${userId}:`, error.response ? error.response.data : error.message);
        throw error;
    }
};


/**
 * 특정 유저의 특정 문제에 대한 제출 상세 정보를 가져옵니다.
 */
// src/Api/SubmitAPI.js (수정된 코드)

export const getSubmitDetail = async (courseId, studentId, problemId) => {
    console.log(`[SubmitAPI] Fetching submit detail for courseId: ${courseId}, studentId: ${studentId}, problemId: ${problemId} from backend.`);
    try {
        if (!courseId || !studentId || !problemId) {
            console.warn("[SubmitAPI] Missing parameters for fetching submit detail. Returning null.");
            return null;
        }
        
        // API 명세에 맞게 URL을 수정합니다.
        const response = await api.get(`/courses/${courseId}/students/${studentId}/problems/${problemId}/submission`);
        
        console.log(`[SubmitAPI] Fetched submit detail:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[SubmitAPI] Error fetching submit detail:`, error.response ? error.response.data : error.message);
        throw error;
    }
};


/**
 * ✨ [신규 추가] 특정 학생의 모든 제출 기록을 CSV 파일로 내보냅니다.
 * @param {string} classId - 강좌 ID
 * @param {string} studentId - 학생 ID
 * @param {boolean} includeUnsubmitted - 미제출 문제 포함 여부
 * @returns {Promise<Blob>} - CSV 파일 데이터
 */
export const exportSubmissionsAsCsv = async (classId, studentId, includeUnsubmitted = true) => {
    console.log(`[SubmitAPI] Exporting submissions as CSV for studentId: ${studentId}`);
    try {
        const response = await api.get(
            `/courses/${classId}/students/${studentId}/submissions/export.csv`,
            {
                // 쿼리 파라미터를 설정합니다.
                params: {
                    include_unsubmitted: includeUnsubmitted
                },
                // 서버 응답을 JSON이 아닌 파일(blob) 형태로 받도록 설정합니다.
                responseType: 'blob',
            }
        );
        return response.data;
    } catch (error) {
        console.error(`[SubmitAPI] Error exporting submissions for studentId ${studentId}:`, error);
        throw error;
    }
};
/**
 * ✨ [신규 추가] 강좌의 모든 학생 점수 기록을 CSV 파일로 내보냅니다.
 * @param {string} classId - 강좌 ID
 * @returns {Promise<Blob>} - CSV 파일 데이터
 */
export const exportCourseScoresAsCsv = async (classId) => {
    console.log(`[SubmitAPI] Exporting all course scores as CSV for classId: ${classId}`);
    try {
        const response = await api.get(
            `/courses/${classId}/students/scores/export.csv`,
            {
                // 서버 응답을 JSON이 아닌 파일(blob) 형태로 받도록 설정합니다.
                responseType: 'blob',
            }
        );
        return response.data;
    } catch (error) {
        console.error(`[SubmitAPI] Error exporting course scores for classId ${classId}:`, error);
        throw error;
    }
};

export const approveSubmissionReset = async (courseId, studentId, problemId) => {
    console.log(`[SubmitAPI] Approving submission reset for courseId: ${courseId}, studentId: ${studentId}, problemId: ${problemId}`);
    try {
        // [수정] 새 API 문서에 맞게 URL 경로에서 '/courses'를 삭제합니다.
        const url = `/${courseId}/students/${studentId}/problems/${problemId}/reset-submission`;

        const response = await api.post(url); // POST 요청 시 본문(body)은 비워둡니다.
        
        console.log(`[SubmitAPI] Submission reset approved:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[SubmitAPI] Error approving submission reset:`, error.response ? error.response.data : error.message);
        if (error.response?.status === 404) {
             throw new Error('초기화 승인 API 경로를 찾을 수 없습니다. (404)');
        }
        throw new Error(error.response?.data?.detail || '초기화 승인 중 오류가 발생했습니다.');
    }
};