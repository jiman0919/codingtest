import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProblemDetail, deleteProblem } from '../Api/ProblemAPI';
import { getClassById } from '../Api/ClassAPI';
import './ProblemDetail.css';

const ProblemDetail = () => {
    const { classId, problemId } = useParams();
    const navigate = useNavigate();

    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [classLanguage, setClassLanguage] = useState('');

    useEffect(() => {
        const fetchProblemAndClass = async () => {
            if (!problemId) {
                setError("문제 ID가 유효하지 않습니다. 올바른 경로로 접근해주세요.");
                setLoading(false);
                return;
            }
            try {
                const [problemData, classData] = await Promise.all([
                    getProblemDetail(problemId),
                    getClassById(classId)
                ]);
                setProblem(problemData);
                setClassLanguage(classData.language);
            } catch (err) {
                console.error("Failed to fetch problem detail:", err);
                setError('문제 상세 정보를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (problemId && classId) {
            fetchProblemAndClass();
        } else {
            setError('유효한 문제 ID 또는 강좌 ID가 없습니다.');
            setLoading(false);
        }
    }, [problemId, classId]);

    const handleDelete = async () => {
        if (window.confirm('정말로 이 문제를 삭제하시겠습니까?')) {
            try {
                setLoading(true);
                await deleteProblem(problemId);
                alert('문제가 성공적으로 삭제되었습니다.');
                const redirectPath = `/admin/classes/${classId}/problems`;
                navigate(redirectPath);
            } catch (err) {
                console.error("문제 삭제 실패:", err);
                setError(`문제 삭제에 실패했습니다: ${err.message || err.response?.data?.detail}`);
                setLoading(false);
            }
        }
    };

    const handleEdit = () => {
        const editPath = `/admin/classes/${classId}/problems/edit/${problemId}`;
        navigate(editPath);
    };

    // ✨ [수정] 뒤로가기 버튼 핸들러
    const handleGoBack = () => {
        // 이전 페이지(-1) 대신, 항상 문제 목록 페이지로 이동하도록 경로를 지정합니다.
        navigate(`/admin/classes/${classId}/problems`);
    };

    if (loading) return <div className="problemdetail-loading-message">문제 상세 정보를 불러오는 중...</div>;
    if (error) return <div className="problemdetail-error-message">오류: {error}</div>;
    if (!problem) return <div className="problemdetail-no-data-message">문제 정보가 없습니다.</div>;

    const { examples = [], testcases = [] } = problem;

    return (
        <div className="problemdetail-problem-add-container">
            <button onClick={handleGoBack} className="problemdetail-back-button">뒤로가기</button>

            <h2>{problem.title}</h2>
            <p className="problemdetail-problem-score">배점: {problem.score}점</p>

            <div className="problemdetail-problem-description-box">
                <h3>문제 설명</h3>
                <p>{problem.description}</p>
            </div>

            {classLanguage === 'python' && problem.function_name && (
                <div className="problemdetail-problem-description-box">
                    <h3>함수 이름</h3>
                    <p>{problem.function_name}</p>
                </div>
            )}
            
            {problem.default_code && (
                <div className="problemdetail-problem-description-box">
                    <h3>기본 코드</h3>
                    <pre className="problemdetail-code-block">{problem.default_code}</pre>
                </div>
            )}

            <div className="problemdetail-dynamic-section">
                <h3>예시</h3>
                {examples.length > 0 ? (
                    examples.map((example, index) => {
                        const inputs = String(example.input || '').trim().split(/\s+/).filter(i => i);
                        return (
                            <div key={example.id || index} className="problemdetail-example-table-container">
                                <h4>예시 {index + 1}</h4>
                                <table className="problemdetail-dynamic-table problemdetail-test-case-table">
                                    <thead>
                                        <tr>
                                            {inputs.map((_, i) => (
                                                <th key={`ex-header-${i}`} className="problemdetail-test-case-col-input">입력{i + 1}</th>
                                            ))}
                                            <th className="problemdetail-test-case-col-output">예상 출력</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {inputs.map((val, i) => (
                                                <td key={`ex-in-${i}`} className="problemdetail-detail-value">{val}</td>
                                            ))}
                                            <td className="problemdetail-detail-value">{example.expected_output}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )
                    })
                ) : <p>예시가 없습니다.</p>}
            </div>

            <div className="problemdetail-dynamic-section">
                <h3>테스트케이스</h3>
                {testcases.length > 0 ? (
                    testcases.map((tc, index) => {
                        const inputs = String(tc.input || '').trim().split(/\s+/).filter(i => i);
                        return (
                            <div key={tc.id || index} className="problemdetail-example-table-container">
                                <h4>테스트케이스 {index + 1}</h4>
                                <table className="problemdetail-dynamic-table problemdetail-test-case-table">
                                    <thead>
                                        <tr>
                                            {inputs.map((_, i) => (
                                                <th key={`tc-header-${i}`} className="problemdetail-test-case-col-input">입력{i + 1}</th>
                                            ))}
                                            <th className="problemdetail-test-case-col-output">예상 출력</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {inputs.map((val, i) => (
                                                <td key={`tc-in-${i}`} className="problemdetail-detail-value">{val}</td>
                                            ))}
                                            <td className="problemdetail-detail-value">{tc.expected_output}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )
                    })
                ) : <p>테스트케이스가 없습니다.</p>}
            </div>

            <div className="problemdetail-form-buttons">
                <button onClick={handleEdit} className="problemdetail-submit-button">수정</button>
                <button onClick={handleDelete} className="problemdetail-cancel-button problemdetail-delete-button">삭제</button>
            </div>
        </div>
    );
};

export default ProblemDetail;