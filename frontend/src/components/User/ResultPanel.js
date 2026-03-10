import React, { useState, useEffect, useRef } from 'react';
import './ResultPanel.css';

function ResultPanel({ result, problemId }) {
    const [localResult, setLocalResult] = useState(null);
    const prevProblemIdRef = useRef(problemId);

    useEffect(() => {
        if (prevProblemIdRef.current !== problemId) {
            setLocalResult(null);
            prevProblemIdRef.current = problemId;
        } 
        else {
            setLocalResult(result);
        }
    }, [result, problemId]);

    if (!localResult) {
        return (
            <div className="resultpanel-result-panel">
                <h3 className="resultpanel-result-title">출력 결과</h3>
                <p className="resultpanel-no-result-message">코드를 실행하거나 제출하면 결과가 여기에 표시됩니다.</p>
            </div>
        );
    }

    if (localResult.submissionStatus === 'success') {
        return (
            <div className="resultpanel-result-panel">
                <h3 className="resultpanel-result-title">제출 결과</h3>
                <p className="resultpanel-submission-success">제출 완료</p>
            </div>
        );
    }
    
    if (localResult.submissionStatus === 'already_submitted') {
        return (
            <div className="resultpanel-result-panel">
                <h3 className="resultpanel-result-title">제출 결과</h3>
                <p className="resultpanel-text-error resultpanel-info-message">
                    {localResult.message || '이미 제출한 문제입니다.'}
                </p>
            </div>
        );
    }
    
    const getStatusText = (statusId) => {
        const statuses = { 
        1: '대기 중', 
        2: '처리 중', 
        3: '실행 성공', 
        4: '오답', 
        5: '시간 초과', 
        6: '컴파일 에러', 
        7: '런타임 에러', 
        8: '런타임 에러 (NZEC)', 
        9: '런타임 에러 (OTHER)', 
        10: '런타임 에러 (ADDRESS)', 
        11: '런타임 에러 (MEMORY)', 
        12: '런타임 에러 (ILLEGAL)', 
        13: '내부 에러', 
        14: '실행 에러' 
        };
        return statuses[statusId] || `상태 ${statusId}`;
    };

    if (localResult.isSubmission && Array.isArray(localResult.testcase_results)) {
        const submissionStatuses = localResult.testcase_results;
        const isCorrect = submissionStatuses.every(tc => tc.passed);
        const overallStatus = isCorrect ? '정답' : '오답';
        const statusClass = isCorrect ? 'resultpanel-text-success' : 'resultpanel-text-error';

        return (
            <div className="resultpanel-result-panel">
                <div className="resultpanel-result-header-line">
                    <h3 className="resultpanel-result-title">제출 결과</h3>
                    <span className={`resultpanel-result-overall-status ${statusClass}`}>
                        {overallStatus}
                    </span>
                </div>
                <div className="resultpanel-result-output-section">
                    <h4>테스트케이스 결과</h4>
                    <ul className="resultpanel-testcase-list">
                        {submissionStatuses.length > 0 ? (
                            submissionStatuses.map((tc, index) => (
                                <li key={index} className={`resultpanel-testcase-item ${tc.passed ? 'resultpanel-passed' : 'resultpanel-failed'}`}>
                                    <span className="resultpanel-testcase-status-text">
                                        테스트 {index + 1}: {tc.passed ? '통과' : '실패'}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <li className="resultpanel-no-test-results-message">테스트 결과가 없습니다.</li>
                        )}
                    </ul>
                </div>
            </div>
        );
    }

    const statusId = localResult.status?.id;
    const isSuccess = statusId === 3;
    const statusClass = isSuccess ? 'resultpanel-text-success' : 'resultpanel-text-error';
    const outputText = localResult.stdout || localResult.stderr || localResult.compile_output;
    const hasError = localResult.stderr || localResult.compile_output || !isSuccess;

    return (
        <div className="resultpanel-result-panel">
            <div className="resultpanel-result-header-line">
                <h3 className="resultpanel-result-title">실행 결과</h3>
                <div className="resultpanel-result-meta">
                    {statusId && (
                        <span className={`resultpanel-result-status ${statusClass}`}>상태: {getStatusText(statusId)}</span>
                    )}
                    {localResult.time && (
                        <span className="resultpanel-result-meta-item">런타임: {localResult.time}초</span>
                    )}
                    {localResult.memory && (
                        <span className="resultpanel-result-meta-item">메모리: {localResult.memory}KB</span>
                    )}
                </div>
            </div>
            <div className="resultpanel-result-output-section">
                <pre className={`resultpanel-result-output ${hasError ? 'resultpanel-text-error' : ''}`}>
                    {outputText || '출력 내용이 없습니다.'}
                </pre>
            </div>
        </div>
    );
}

export default ResultPanel;