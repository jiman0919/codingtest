import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubmitUserList, getSubmitProblemList, getSubmitDetail, approveSubmissionReset } from '../Api/SubmitAPI';
import { getProblemDetail } from '../Api/ProblemAPI';
import './SubmitDetail.css';

const SubmitDetail = () => {
    const { classId, userId, problemId } = useParams();
    const navigate = useNavigate();
    const [submissionDetail, setSubmissionDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userName, setUserName] = useState('');
    const [problemTitle, setProblemTitle] = useState('');
    const [problemDescription, setProblemDescription] = useState('');

    const testcase_results = submissionDetail?.testcase_results;

    const processedTestCases = useMemo(() => {
        if (!testcase_results || testcase_results.length === 0) {
            return { maxInputs: 0, results: [] };
        }

        let maxInputs = 0;
        const results = testcase_results.map(tc => {
            const inputStr = tc.testcase_input != null ? String(tc.testcase_input) : '';
            const inputs = inputStr.split('\n');
            if (inputs.length > maxInputs) {
                maxInputs = inputs.length;
            }
            return { ...tc, inputs };
        });

        return { maxInputs, results };
    }, [testcase_results]);


    const fetchAllDetails = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!classId || !userId || !problemId) {
            setError('필요한 정보(강좌 ID, 유저 ID, 문제 ID)가 부족합니다.');
            setLoading(false);
            return;
        }

        try {
            const [userList, problemList, submissionData, problemData] = await Promise.all([
                getSubmitUserList(classId),
                getSubmitProblemList(classId, userId),
                getSubmitDetail(classId, userId, problemId),
                getProblemDetail(problemId)
            ]);

            const currentUser = userList.find(user => user?.user_id?.toString() === userId);
            setUserName(currentUser ? currentUser.name : '알 수 없는 유저');

            const currentProblem = problemList.find(p => p?.problem_id?.toString() === problemId);
            setProblemTitle(currentProblem ? currentProblem.problem_title : `알 수 없는 문제 (${problemId})`);

            setProblemDescription(problemData?.description || '문제 설명이 없습니다.');

            if (submissionData && submissionData.detail) {
                setSubmissionDetail(null);
            } else {
                setSubmissionDetail(submissionData);
            }
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || '알 수 없는 오류';
            setError('제출 상세 정보를 불러오는 중 오류가 발생했습니다: ' + errorMessage);
            console.error('Error fetching submission detail:', err);
        } finally {
            setLoading(false);
        }
    }, [classId, userId, problemId]);

    useEffect(() => {
        fetchAllDetails();
    }, [fetchAllDetails]);

    const handleResetSubmission = async () => {
        if (window.confirm(`${userName} 학생의 제출 기록을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
            try {
                const response = await approveSubmissionReset(classId, userId, problemId);
                alert(response.message || '제출 기록이 성공적으로 초기화되었습니다.');
                navigate(-1); 
            } catch (err) {
                const errorMessage = err.response?.data?.detail || '해당 학생이 초기화 요청을 하지 않았습니다.';
                alert(errorMessage);
            }
        }
    };

    if (loading) return <div className="submitdetail-loading-message">제출 상세 정보를 불러오는 중...</div>;

    if (error) {
        return (
            <div className="submitdetail-error-message">
                <p>오류 발생: {error}</p>
                <div style={{ marginTop: '10px' }}>
                    <button onClick={fetchAllDetails} style={{ marginRight: '10px' }}>다시 시도</button>
                    <button onClick={() => navigate(-1)}>뒤로 가기</button>
                </div>
            </div>
        );
    }

    if (!submissionDetail) {
        return (
            <div className="submitdetail-submission-detail-container">
                <div className="submitdetail-detail-header">
                    <button className="submitdetail-back-button" onClick={() => navigate(-1)}>뒤로 가기</button>
                    <h2 className="submitdetail-submission-detail-title">{userName} 님의 {problemTitle} 제출 상세</h2>
                </div>
                <p className="submitdetail-no-data-message">해당 문제에 대한 제출 기록이 없습니다.</p>
            </div>
        );
    }

    const {
        source_code,
        is_correct,
        score,
        submitted_at,
    } = submissionDetail;

    const result_text = is_correct ? '정답' : '오답';

    return (
        <div className="submitdetail-submission-detail-container">
            <div className="submitdetail-detail-header">
                <button className="submitdetail-back-button" onClick={() => navigate(-1)}>뒤로 가기</button>
                <h2 className="submitdetail-submission-detail-title">{userName} 님의 "{problemTitle}" 제출 상세</h2>
                <button 
                    className="submitdetail-approve-reset-button"
                    onClick={handleResetSubmission}
                >
                    제출 기록 초기화
                </button>
            </div>
            <div className="submitdetail-submission-card">
                <div className="submitdetail-detail-row">
                    <span className="submitdetail-detail-label">제출 시각:</span>
                    <span className="submitdetail-detail-value">{new Date(submitted_at).toLocaleString('ko-KR')}</span>
                </div>
                <div className="submitdetail-detail-row">
                    <span className="submitdetail-detail-label">채점 결과:</span>
                    <span className={`submitdetail-detail-value submitdetail-status-${result_text}`}>
                        {result_text} ({score}점)
                    </span>
                </div>
                <div className="submitdetail-code-section">
                    <h3>문제 설명</h3>
                    <p className="submitdetail-problem-description">{problemDescription}</p>
                </div>
                <div className="submitdetail-code-section">
                    <h3>제출 코드</h3>
                    <pre className="submitdetail-code-block">{source_code || '제출된 코드가 없습니다.'}</pre>
                </div>
                <div className="submitdetail-test-case-section">
                    <h3>테스트 케이스 결과</h3>
                    {testcase_results && testcase_results.length > 0 ? (
                        <table className="submitdetail-test-case-table">
                            <thead>
                                <tr>
                                    <th>테스트</th>
                                    {Array.from({ length: processedTestCases.maxInputs }, (_, i) => (
                                        <th key={`input-header-${i}`}>입력 {i + 1}</th>
                                    ))}
                                    <th>예상 출력</th>
                                    <th>실제 출력</th>
                                    <th>통과 여부</th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedTestCases.results.map((tc, index) => (
                                    <tr key={index} className={`submitdetail-test-case-row submitdetail-status-${tc.passed ? '통과' : '실패'}`}>
                                        {/* ▼▼▼ [수정] data-label 속성 추가 ▼▼▼ */}
                                        <td data-label="테스트">{index + 1}</td>
                                        {Array.from({ length: processedTestCases.maxInputs }, (_, i) => (
                                            <td key={`input-${index}-${i}`} data-label={`입력 ${i + 1}`}>
                                                {tc.inputs[i] !== undefined ? <code>{JSON.stringify(tc.inputs[i])}</code> : null}
                                            </td>
                                        ))}
                                        <td data-label="예상 출력"><code>{JSON.stringify(tc.expected_output)}</code></td>
                                        <td data-label="실제 출력"><code>{JSON.stringify(tc.actual_output)}</code></td>
                                        <td data-label="통과 여부" className="submitdetail-test-status">
                                            {tc.passed ? '통과' : '실패'}
                                        </td>
                                        {/* ▲▲▲ [수정] 여기까지 ▲▲▲ */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="submitdetail-no-data-message">테스트 케이스 결과가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmitDetail;