import axios from 'axios';

// 백엔드 API 기본 URL
const API_BASE_URL = 'https://api.hcodetest.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 토큰 삭제 및 로그인 페이지로 리디렉션하는 공통 함수
const logoutAndRedirect = () => {
    console.log("로그아웃 처리: 로컬 스토리지 토큰 삭제 및 로그인 페이지로 이동");
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    window.location.href = '/login';
};


// 요청 인터셉터: 모든 API 요청 헤더에 Access Token을 자동으로 추가
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터: 401 오류 발생 시 Refresh Token으로 Access Token 재발급 시도
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`
                        }
                    });

                    const newAccessToken = refreshResponse.data.access_token;
                    
                    localStorage.setItem('access_token', newAccessToken);

                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                    return api(originalRequest);

                } catch (refreshError) {
                    console.error('Refresh token failed:', refreshError);
                    logoutAndRedirect();
                    return Promise.reject(refreshError);
                }
            } else {
                logoutAndRedirect();
            }
        }
        return Promise.reject(error);
    }
);


// =======================================================
// 인증 관련 API
// =======================================================
export const loginUser = async (username, password) => {
    try {
        const response = await api.post('/auth/login', { username, password });
        const { access_token, refresh_token, user_id, user_name } = response.data;
        
        if (access_token && refresh_token && user_id) {
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('user_id', user_id);
            localStorage.setItem('user_name', user_name);
        }
        return response.data;
    } catch (error) {
        console.error("로그인 실패:", error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        console.log("Logging out, sending request to backend...");
        await api.post('/auth/logout');
        console.log("Backend logout successful.");
    } catch (error) {
        console.error('로그아웃 API 호출 실패:', error);
    } finally {
        logoutAndRedirect();
    }
};

// =======================================================
// 문제 및 채점 관련 API
// =======================================================
export const submitCode = async ({ source_code, language_id, stdin, problem_id }) => {
    try {
        const response = await api.post('/submit', { source_code, language_id, stdin, problem_id });
        return response.data;
    } catch (error) {
        console.error("오류 응답:", error.response?.data);
        throw new Error(error.response?.data?.detail || '코드 실행 중 오류가 발생했습니다.');
    }
};

export const getSubmission = async (submissionId) => {
    try {
        const response = await api.get(`/submissions/${submissionId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '결과 조회 중 오류가 발생했습니다.');
    }
};

export const getLanguages = async () => {
    try {
        const response = await api.get('/languages');
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || '언어 목록 조회 중 오류가 발생했습니다.');
    }
};

export const submitAndEvaluate = async (payload) => {
    try {
        if (!payload) {
            throw new Error("submitAndEvaluate 호출 시 payload가 undefined입니다.");
        }

        const { user_id, problem_id, source_code, language_id } = payload;

        const response = await api.post('/submit-testcases', {
            user_id,
            problem_id,
            source_code,
            language_id
        });

        return response.data;
    } catch (error) {
        console.error("채점 오류 응답:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || '채점 중 오류가 발생했습니다.');
    }
};

export const requestSubmissionReset = async (problemId) => {
    try {
        const url = `/student/courses/problems/${problemId}/request-reset`;
        const response = await api.post(url, {}); 
        return response.data;
    } catch (error) {
        console.error("제출 기록 초기화 요청 실패:", error.response?.data || error.message);
        if (error.response?.status === 404) {
             throw new Error('초기화 요청 API 경로를 찾을 수 없습니다. (404)');
        }
        throw new Error(error.response?.data?.detail || '초기화 요청 중 오류가 발생했습니다.');
    }
};

// =======================================================
// 강좌 관련 API (유저용)
// =======================================================

export const getAllClasses = async () => {
    try {
        const response = await api.get('/student/courses');
        return response.data;
    } catch (error) {
        console.error("전체 강좌 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

export const getEnrolledClasses = async () => {
    try {
        const response = await api.get('/student/my_courses');
        return response.data;
    } catch (error) {
        console.error("수강 신청한 강좌 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

export const enrollClass = async (classId, currentId) => {
    try {
        const response = await api.post('/student/enroll', { 
            course_id: classId,
            current_id: currentId
        });
        return response.data;
    } catch (error) {
        console.error(`강좌 ID ${classId} 수강 신청 중 오류 발생:`, error);
        throw error;
    }
};

export const getProblemList = async (classId) => {
    try {
        const response = await api.get(`/student/courses/${classId}/problems`);
        return response.data;
    } catch (error) {
        console.error("특정 강좌 문제 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

export const getProblemDetail = async (problemId) => {
    try {
        const response = await api.get(`/student/courses/problems/${problemId}`);
        return response.data;
    } catch (error) {
        console.error("문제 상세 정보를 가져오는 중 오류 발생:", error);
        throw error;
    }
};

// =======================================================
// 관리자 관련 API
// =======================================================
export const getAllProfessors = async () => {
    try {
        const response = await api.get('/admin/professors');
        return response.data;
    } catch (error) {
        console.error("교수 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

export const fetchAllUsers = async () => {
    try {
        const response = await api.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error("사용자 목록을 불러오는 중 오류 발생:", error);
        throw error;
    }
};

// =======================================================
// 문제 관리 관련 API
// =======================================================
export const getAdminProblemList = async () => {
    try {
        const response = await api.get('/problems');
        return response.data;
    } catch (error) {
        console.error("문제 목록을 가져오는 중 오류 발생:", error);
        throw error;
    }
};

export const addProblem = async (problemData) => {
    try {
        const response = await api.post('/problems', problemData);
        return response.data;
    } catch (error) {
        console.error("문제 추가 중 오류 발생:", error);
        throw error;
    }
};

// ▼▼▼ [추가] 학생의 문제 제출 상태 목록을 가져오는 API 함수 ▼▼▼
export const getSubmissionStatusForCourse = async (courseId) => {
    try {
        const response = await api.get(`/student/courses/${courseId}/problems/submission-status`);
        return response.data;
    } catch (error) {
        console.error("제출 상태 목록 조회 중 오류 발생:", error);
        throw error;
    }
};
// ▲▲▲ [추가] 여기까지 ▲▲▲


export default api;