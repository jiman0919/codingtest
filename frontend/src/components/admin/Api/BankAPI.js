import api from '../../../services/api';

// ... (getMyBankProblems, getOthersBankProblems, getProblemBankDetail, deleteBankItem 함수는 그대로 유지) ...

/**
 * 내가 만든 문제 은행 문제 목록을 가져옵니다.
 * @param {string | number} classId - 강좌 ID
 * @returns {Promise<Array<object>>} 내가 만든 문제 목록 배열
 */
export const getMyBankProblems = async (classId) => {
    try {
        const response = await api.get('/bank/mine', { params: { class_id: classId } });
        return response.data;
    } catch (error) {
        console.error("Error fetching my bank problems:", error);
        throw error;
    }
};

/**
 * 다른 사람이 만든 문제 은행 문제 목록을 가져옵니다.
 * @param {string | number} classId - 강좌 ID
 * @returns {Promise<Array<object>>} 다른 사람이 만든 문제 목록 배열
 */
export const getOthersBankProblems = async (classId) => {
    try {
        const response = await api.get('/bank/others', { params: { class_id: classId } });
        return response.data;
    } catch (error) {
        console.error("Error fetching others' bank problems:", error);
        throw error;
    }
};

/**
 * 문제 은행에서 특정 문제의 상세 정보를 가져옵니다.
 * @param {number} bankItemId - 조회할 문제의 ID
 * @returns {Promise<object>} 문제 상세 정보 객체
 */
export const getProblemBankDetail = async (bankItemId) => {
    try {
        const response = await api.get(`/bank/${bankItemId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching bank item detail for ID ${bankItemId}:`, error);
        throw error;
    }
};

/**
 * 문제 은행에서 특정 문제를 삭제합니다.
 * @param {number} bankItemId - 삭제할 문제의 ID
 * @returns {Promise<void>}
 */
export const deleteBankItem = async (bankItemId) => {
    try {
        await api.delete(`/bank/${bankItemId}`);
    } catch (error) {
        console.error(`Error deleting bank item with ID ${bankItemId}:`, error);
        throw error;
    }
};

/**
 * ✨ [추가] 문제 은행의 문제를 특정 강좌로 가져옵니다.
 * @param {string | number} courseId - 가져올 강좌의 ID
 * @param {string | number} bankItemId - 가져올 문제 은행 아이템의 ID
 * @returns {Promise<void>}
 */
export const importProblemFromBank = async (courseId, bankItemId) => {
    try {
        console.log(`Importing bank item ${bankItemId} into course ${courseId}...`);
        // POST 요청 시 body는 비어있으므로 null을 전달하고, params를 세 번째 인자로 전달합니다.
        await api.post('/bank/problems/import', null, {
            params: {
                course_id: courseId,
                bank_item_id: bankItemId
            }
        });
        console.log('Successfully imported problem.');
    } catch (error) {
        console.error('Error importing problem from bank:', error);
        throw error;
    }
};