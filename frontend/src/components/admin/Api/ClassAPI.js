// src/admin/Api/ClassAPI.js

// api.js 파일에서 설정한 axios 인스턴스를 가져옵니다.
import api from '../../../services/api';

/**
 * 모든 강좌 목록을 백엔드에서 가져옵니다.
 */
export const getClassList = async () => {
    try {
        console.log("Fetching class list from backend...");
        const response = await api.get('/courses');
        console.log("Class list fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching class list from backend:', error);
        throw error;
    }
};

/**
 * 특정 ID의 강좌 정보를 백엔드에서 가져옵니다.
 * @param {number} classId - 조회할 강좌의 ID
 */
export const getClassById = async (classId) => {
    try {
        console.log(`Fetching class ${classId} from backend...`);
        // ✨ '/classes' -> '/courses'로 경로 변경
        const response = await api.get(`/courses/${classId}`); 
        console.log(`Class ${classId} fetched:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error fetching class ${classId} from backend:`, error);
        throw error;
    }
};

/**
 * 새 강좌를 백엔드에 추가합니다.
 * 백엔드에 POST /courses 엔드포인트가 필요합니다.
 * @param {object} classData - 강좌 데이터 (name, language, max_students)
 */
export const addClass = async (classData) => {
    try {
        console.log("Adding new class to backend:", classData);
        const response = await api.post('/courses', classData);
        console.log("New class added:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error adding class to backend:', error);
        throw error;
    }
};


/**
 * 특정 ID의 강좌 정보를 백엔드에서 수정합니다.
 * @param {number} classId - 수정할 강좌의 ID
 * @param {object} updatedData - 수정할 강좌 데이터 (name, code, language, max_students 등)
 */
export const updateClass = async (classId, updatedData) => {
    try {
        console.log(`Updating class ${classId} in backend:`, updatedData);
        // ✨ '/classes' -> '/courses'로 경로 변경
        const response = await api.put(`/courses/${classId}`, updatedData);
        console.log(`Class ${classId} updated:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error updating class ${classId} in backend:`, error);
        throw error;
    }
};


/**
 * 특정 ID의 강좌를 백엔드에서 삭제합니다.
 * 백엔드에 DELETE /courses/{classId} 엔드포인트가 필요합니다.
 * @param {number} classId - 삭제할 강좌의 ID
 */
export const deleteClass = async (classId) => {
    try {
        console.log(`Deleting class ${classId} from backend...`);
        const response = await api.delete(`/courses/${classId}`);
        console.log(`Class ${classId} deleted:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`Error deleting class ${classId} from backend:`, error);
        throw error;
    }
};