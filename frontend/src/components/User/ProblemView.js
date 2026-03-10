import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ProblemView.css';
import { getProblemDetail, getProblemList } from '../../services/api';

function ProblemView() {
    const navigate = useNavigate();
    const { classId, problemId } = useParams();
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [problemList, setProblemList] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const problems = await getProblemList(classId);
                problems.sort((a, b) => a.id - b.id);
                setProblemList(problems);

                const problemDetail = await getProblemDetail(problemId);
                setProblem(problemDetail);

                setError(null);
            } catch (err) {
                setError('문제 정보를 가져오는 데 실패했습니다.');
                console.error('Error fetching data:', err);
                setProblem(null);
            } finally {
                setLoading(false);
            }
        };

        if (classId && problemId) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [classId, problemId]);

    // ▼▼▼ [수정] 이 함수를 변경했습니다. ▼▼▼
    const handleBackClick = () => {
        if (window.confirm("변경한 내용이 저장되지 않을 수 있습니다. 정말로 목록으로 돌아가시겠습니까?")) {
            navigate(`/user/classes/${classId}/problems`);
        }
    };
    // ▲▲▲ [수정] 여기까지 ▲▲▲

    const currentProblemIndex = problemList.findIndex(p => p.id === parseInt(problemId));
    const isFirstProblem = currentProblemIndex === 0;
    const isLastProblem = currentProblemIndex === problemList.length - 1;

    const handlePreviousProblem = () => {
        if (!isFirstProblem) {
            const prevProblemId = problemList[currentProblemIndex - 1].id;
            navigate(`/user/classes/${classId}/problems/${prevProblemId}`);
        }
    };

    const handleNextProblem = () => {
        if (!isLastProblem) {
            const nextProblemId = problemList[currentProblemIndex + 1].id;
            navigate(`/user/classes/${classId}/problems/${nextProblemId}`);
        }
    };

    if (loading) {
        return <div className="problemview-problem-view-container">로딩 중...</div>;
    }

    if (error) {
        return <div className="problemview-problem-view-container">{error}</div>;
    }

    if (!problem) {
        return <div className="problemview-problem-view-container">문제가 존재하지 않습니다.</div>;
    }

    const { examples = [] } = problem;

    return (
        <div className="problemview-problem-view-container">
            <div className="problemview-problem-nav-buttons">
                <button onClick={handleBackClick} className="problemview-back-to-problem-list-button">
                    문제 목록
                </button>
                <div className="problemview-problem-nav-right">
                    <button
                        onClick={handlePreviousProblem}
                        className="problemview-nav-button problemview-prev-button"
                        style={{ visibility: isFirstProblem ? 'hidden' : 'visible' }}
                    >
                        이전 문제
                    </button>
                    <button
                        onClick={handleNextProblem}
                        className="problemview-nav-button problemview-next-button"
                        style={{ visibility: isLastProblem ? 'hidden' : 'visible' }}
                    >
                        다음 문제
                    </button>
                </div>
            </div>
            <div className="problemview-problem-header">
                <h1 className="problemview-problem-title">{problem.title}</h1>
                {problem.score && <span className="problemview-problem-score">배점: {problem.score}점</span>}
            </div>
            <div className="problemview-problem-section">
                <h2 className="problemview-section-title">문제 설명</h2>
                <div className="problemview-problem-description">
                    {problem.description.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </div>
            </div>

            <div className="problemview-problem-section">
                <h2 className="problemview-section-title">입출력 예</h2>
                {examples.length > 0 ? (
                    examples.map((example, index) => {
                        const inputs = (example.input || '').trim().split(/\s+/).filter(i => i);
                        const output = (example.expected_output || '').trim();

                        return (
                            <div key={example.id || index} className="problemview-example-table-container">
                                <h4>입출력 예시 {index + 1}</h4>
                                <table className="problemview-problem-table">
                                    <thead>
                                        <tr>
                                            {inputs.map((_, i) => (
                                                <th key={i} className="problemview-table-header-cell">입력{i + 1}</th>
                                            ))}
                                            <th className="problemview-table-header-cell">출력</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            {inputs.map((val, i) => (
                                                <td key={i} className="problemview-table-cell">{val}</td>
                                            ))}
                                            <td className="problemview-table-cell">{output}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })
                ) : (
                    <p>입출력 예시가 없습니다.</p>
                )}
            </div>

        </div>
    );
}

export default ProblemView;